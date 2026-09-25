import type { LyricsResult, RepeatMode, Song } from '../types/music';
import { createStore, useStore } from '../lib/store';
import { youtubeService, PlayerStates, EngineErrors } from '../services/youtube';
import { resolveSongWithVersions, peekResolved, prefetchSong, markVideoFailed } from '../services/searchService';
import { fetchLyrics } from '../services/lyricsService';
import { addToPlayHistory, getSettings, updateSettings, slimSong } from '../services/storageService';
import { artwork } from '../lib/images';
import { EQ_PRESETS } from '../services/config';
import { safeStorage } from '../lib/net';

/**
 * Estado global del reproductor.
 *
 * Diseño de rendimiento:
 *  - `playerStore`: estado "lento" (canción, cola, play/pausa…). Cambia pocas
 *    veces por minuto.
 *  - `progressStore`: tiempo actual, 4 ticks/s. Solo lo leen las barras de
 *    progreso y las letras, así el resto de la app no se re-renderiza.
 *  - Las acciones son funciones de módulo estables que leen siempre el estado
 *    actual (sin closures obsoletos en MediaSession ni atajos de teclado).
 */

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  playbackRate: number;
  queue: Song[];
  queueIndex: number;
  lyrics: LyricsResult | null;
  isLoadingLyrics: boolean;
  sleepEndsAt: number | null;
  sleepAtTrackEnd: boolean;
  playbackError: string | null;
}

const settings = getSettings();

export const playerStore = createStore<PlayerState>({
  currentSong: null,
  isPlaying: false,
  isLoading: false,
  duration: 0,
  volume: settings.volume,
  isMuted: false,
  isShuffle: settings.trueShuffle,
  repeatMode: 'off',
  playbackRate: settings.playbackRate,
  queue: [],
  queueIndex: 0,
  lyrics: null,
  isLoadingLyrics: false,
  sleepEndsAt: null,
  sleepAtTrackEnd: false,
  playbackError: null,
});

export const progressStore = createStore({ currentTime: 0 });

export function usePlayer<S>(selector: (s: PlayerState) => S): S {
  return useStore(playerStore, selector);
}

export function useCurrentTime(): number {
  return useStore(progressStore, (s) => s.currentTime);
}

/** `true` si esta canción es la actual y está sonando (re-render solo al cambiar). */
export function useIsSongPlaying(songId: string): boolean {
  return useStore(playerStore, (s) => s.isPlaying && s.currentSong?.id === songId);
}

export function useIsCurrentSong(songId: string): boolean {
  return useStore(playerStore, (s) => s.currentSong?.id === songId);
}

const get = playerStore.get;
const set = playerStore.set;

// ---------------------------------------------------------------------------
// Internos
// ---------------------------------------------------------------------------

/** Token de reproducción: invalida resoluciones lentas si el usuario ya cambió de canción. */
let playToken = 0;
/** Protección contra PAUSED espurio de YouTube durante la carga (lección nº3). */
let isStarting = false;
let startingTimer: ReturnType<typeof setTimeout> | null = null;
let loadingTimer: ReturnType<typeof setTimeout> | null = null;
let triedIds = new Set<string>();
let reResolved = false;
let consecutiveFailures = 0;
/** Posición pendiente de una sesión restaurada: se carga al pulsar Play. */
let resumeAt: number | null = null;
/** Entre elegir canción y cargarla en el motor: la anterior se silencia y su progreso se ignora. */
let switchingTrack = false;

function fisherYates<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function armStartingGuard(ms = 5000) {
  isStarting = true;
  if (startingTimer) clearTimeout(startingTimer);
  startingTimer = setTimeout(() => {
    isStarting = false;
  }, ms);
}

function clearStartingGuard() {
  isStarting = false;
  if (startingTimer) clearTimeout(startingTimer);
  startingTimer = null;
}

function effectiveVolume() {
  const { isMuted, volume } = get();
  return isMuted ? 0 : volume;
}

function loadIntoEngine(videoId: string, startAt = 0) {
  switchingTrack = false;
  triedIds.add(videoId);
  armStartingGuard();
  youtubeService.setVolume(effectiveVolume());
  youtubeService.loadVideo(videoId, startAt, true);
  set({ isPlaying: true, isLoading: true, playbackError: null });

  // Algunos navegadores móviles retrasan el evento PLAYING
  if (loadingTimer) clearTimeout(loadingTimer);
  const token = playToken;
  loadingTimer = setTimeout(() => {
    if (token === playToken) set({ isLoading: false });
  }, 3500);
}

/** Sustituye la canción actual (y su entrada en la cola) por una versión resuelta. */
function replaceCurrent(updated: Song) {
  const { queue, queueIndex } = get();
  set({
    currentSong: updated,
    queue: queue[queueIndex]?.id === updated.id ? queue.map((s, i) => (i === queueIndex ? updated : s)) : queue,
  });
}

function updateMediaSession(song: Song) {
  if (!('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: song.album || 'Free-Spoty',
      artwork: [
        { src: artwork(song.coverUrl, 192), sizes: '192x192', type: 'image/jpeg' },
        { src: artwork(song.coverUrl, 512), sizes: '512x512', type: 'image/jpeg' },
      ],
    });
  } catch {
    /* MediaMetadata no soportado */
  }
}

function loadLyrics(song: Song, token: number) {
  set({ lyrics: null, isLoadingLyrics: true });
  fetchLyrics(song.title, song.artist, song.duration)
    .then((lyrics) => {
      if (token === playToken) set({ lyrics, isLoadingLyrics: false });
    })
    .catch(() => {
      if (token === playToken) set({ lyrics: null, isLoadingLyrics: false });
    });
}

async function startTrack(song: Song, startAt = 0) {
  const token = ++playToken;
  triedIds = new Set();
  reResolved = false;
  resumeAt = null;

  // La canción anterior deja de oírse ya (sin pausar: evita eventos PAUSED)
  switchingTrack = true;
  youtubeService.setVolume(0);

  // Feedback visual inmediato (0 ms): la cápsula aparece con carátula y spinner
  set({
    currentSong: song,
    isLoading: true,
    isPlaying: true,
    duration: song.duration || 0,
    playbackError: null,
  });
  progressStore.set({ currentTime: startAt });
  updateMediaSession(song);
  loadLyrics(song, token);

  // Si ya está resuelta (caché), se carga síncronamente dentro del gesto del usuario
  let resolved = peekResolved(song);
  if (!resolved) {
    try {
      resolved = await resolveSongWithVersions(song);
    } catch (err) {
      console.error('Error al resolver la canción:', err);
      resolved = song;
    }
    if (token !== playToken) return; // el usuario ya eligió otra canción
  }

  replaceCurrent(resolved);

  if (!resolved.youtubeId) {
    handleUnplayable(`No se encontró audio para "${song.title}"`);
    return;
  }

  loadIntoEngine(resolved.youtubeId, startAt);
  addToPlayHistory(resolved);
  saveSession();

  const { queue, queueIndex } = get();
  prefetchSong(queue[queueIndex + 1]);
}

function playAtIndex(index: number) {
  const { queue } = get();
  if (index < 0 || index >= queue.length) return;
  set({ queueIndex: index });
  void startTrack(queue[index]);
}

function handleUnplayable(message: string) {
  if (switchingTrack) {
    // La canción anterior seguía sonando en silencio: se detiene
    switchingTrack = false;
    youtubeService.pause();
    youtubeService.setVolume(effectiveVolume());
  }
  consecutiveFailures++;
  set({ isLoading: false, isPlaying: false, playbackError: message });
  // Evita silencios en la cola, pero sin cascadas infinitas de saltos
  const { queue, queueIndex } = get();
  if (consecutiveFailures < 3 && queueIndex < queue.length - 1) {
    const token = playToken;
    setTimeout(() => {
      if (token === playToken) playAtIndex(queueIndex + 1);
    }, 1200);
  }
}

function handleTrackEnded() {
  clearStartingGuard();
  const { repeatMode, queue, queueIndex, sleepAtTrackEnd } = get();

  if (sleepAtTrackEnd) {
    set({ isPlaying: false, sleepAtTrackEnd: false });
    return;
  }
  if (repeatMode === 'one') {
    youtubeService.seekTo(0);
    youtubeService.play();
    return;
  }
  if (queueIndex < queue.length - 1) playAtIndex(queueIndex + 1);
  else if (repeatMode === 'all' && queue.length > 0) playAtIndex(0);
  else set({ isPlaying: false });
}

/** Recuperación ante errores 100/101/150: siguiente candidato → re-resolución → saltar. */
async function handleEngineError(code: number) {
  const song = get().currentSong;
  if (!song) {
    set({ isLoading: false, isPlaying: false });
    return;
  }
  if (code === EngineErrors.SERVER_DOWN) {
    // Sin servidor no hay audio sin anuncios: se avisa en lugar de saltar canciones
    clearStartingGuard();
    set({
      isLoading: false,
      isPlaying: false,
      playbackError: 'Servidor de audio sin conexión · pulsa Play para reintentar',
    });
    return;
  }
  const token = playToken;
  if (song.youtubeId) markVideoFailed(song, song.youtubeId);

  const next = (song.candidateVideoIds || []).find((id) => !triedIds.has(id));
  if (next) {
    console.info(`[Recuperación] Error ${code}, probando candidato ${next}`);
    replaceCurrent({ ...song, youtubeId: next });
    loadIntoEngine(next);
    return;
  }

  if (!reResolved) {
    reResolved = true;
    try {
      const fresh = await resolveSongWithVersions({ ...song, youtubeId: '' }, { force: true });
      if (token !== playToken) return;
      const candidate = (fresh.candidateVideoIds || []).find((id) => !triedIds.has(id));
      if (candidate) {
        console.info(`[Recuperación] Nuevo ID encontrado: ${candidate}`);
        replaceCurrent({ ...fresh, youtubeId: candidate });
        loadIntoEngine(candidate);
        return;
      }
    } catch {
      /* cae a no reproducible */
    }
  }

  if (token === playToken) handleUnplayable(`"${song.title}" no está disponible ahora mismo`);
}

// ---------------------------------------------------------------------------
// Suscripción al motor de audio
// ---------------------------------------------------------------------------

youtubeService.onStateChange((state) => {
  if (state === PlayerStates.PLAYING) {
    clearStartingGuard();
    consecutiveFailures = 0;
    const dur = youtubeService.getDuration();
    set({ isPlaying: true, isLoading: false, ...(dur > 0 ? { duration: dur } : {}) });
  } else if (state === PlayerStates.PAUSED) {
    if (isStarting) {
      youtubeService.play(); // pausa espuria durante la carga
      return;
    }
    set({ isPlaying: false, isLoading: false });
  } else if (state === PlayerStates.ENDED) {
    handleTrackEnded();
  } else if (state === PlayerStates.BUFFERING) {
    set({ isLoading: true });
  }
});

youtubeService.onError((code) => void handleEngineError(code));

// Tick de progreso: solo mientras suena
let ticker: ReturnType<typeof setInterval> | null = null;
let lastPositionSync = 0;

function tick() {
  if (switchingTrack) return; // el motor aún reproduce la canción anterior
  const time = youtubeService.getCurrentTime();
  progressStore.set({ currentTime: time });
  const dur = youtubeService.getDuration();
  if (dur > 0 && Math.abs(dur - get().duration) > 1) set({ duration: dur });

  const now = Date.now();
  if (now - lastPositionSync > 5000 && dur > 0) {
    lastPositionSync = now;
    saveSession();
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: dur,
        position: Math.min(time, dur),
        playbackRate: get().playbackRate,
      });
    } catch {
      /* noop */
    }
  }
}

playerStore.subscribe(() => {
  const { isPlaying } = get();
  if (isPlaying && !ticker) ticker = setInterval(tick, 250);
  if (!isPlaying && ticker) {
    clearInterval(ticker);
    ticker = null;
    saveSession();
  }
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = get().currentSong ? (isPlaying ? 'playing' : 'paused') : 'none';
  }
});

// Temporizador de apagado con fundido de volumen en los últimos 10 s
let sleepTicker: ReturnType<typeof setInterval> | null = null;

function runSleepTimer() {
  if (sleepTicker) clearInterval(sleepTicker);
  sleepTicker = setInterval(() => {
    const { sleepEndsAt } = get();
    if (sleepEndsAt === null) {
      if (sleepTicker) clearInterval(sleepTicker);
      sleepTicker = null;
      youtubeService.setVolume(effectiveVolume());
      return;
    }
    const remaining = (sleepEndsAt - Date.now()) / 1000;
    if (remaining <= 0) {
      youtubeService.pause();
      set({ isPlaying: false, sleepEndsAt: null });
      // Restaura el volumen para la próxima reproducción
      setTimeout(() => youtubeService.setVolume(effectiveVolume()), 300);
    } else if (remaining <= 10) {
      youtubeService.setVolume((remaining / 10) * effectiveVolume());
    }
  }, 500);
}

// Controles nativos (pantalla de bloqueo, Dynamic Island, teclas multimedia)
if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
  const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
    ['play', () => togglePlay()],
    ['pause', () => togglePlay()],
    ['nexttrack', () => nextTrack()],
    ['previoustrack', () => prevTrack()],
    ['seekto', (d) => d.seekTime !== undefined && seek(d.seekTime)],
    ['seekbackward', (d) => seek(Math.max(0, progressStore.get().currentTime - (d.seekOffset || 10)))],
    ['seekforward', (d) => seek(progressStore.get().currentTime + (d.seekOffset || 10))],
  ];
  for (const [action, handler] of handlers) {
    try {
      navigator.mediaSession.setActionHandler(action, handler);
    } catch {
      /* acción no soportada */
    }
  }
}

// ---------------------------------------------------------------------------
// Sesión: se reanuda la última canción/cola (en pausa) al volver a abrir la app
// ---------------------------------------------------------------------------

const SESSION_KEY = 'free_spoty_session';

interface SavedSession {
  queue: Song[];
  queueIndex: number;
  time: number;
}

function saveSession() {
  const { queue, queueIndex, currentSong } = get();
  if (!currentSong) return;
  // Ventana alrededor de la canción actual para no guardar colas enormes
  const start = Math.max(0, queueIndex - 50);
  safeStorage.set(SESSION_KEY, {
    queue: queue.slice(start, queueIndex + 150).map(slimSong),
    queueIndex: queueIndex - start,
    time: Math.floor(progressStore.get().currentTime),
  } satisfies SavedSession);
}

function restoreSession() {
  const saved = safeStorage.get<SavedSession | null>(SESSION_KEY, null);
  const song = saved?.queue?.[saved.queueIndex];
  if (!saved || !song) return;
  set({ queue: saved.queue, queueIndex: saved.queueIndex, currentSong: song, duration: song.duration || 0 });
  progressStore.set({ currentTime: saved.time || 0 });
  resumeAt = saved.time || 0;
  updateMediaSession(song);
  loadLyrics(song, playToken);
}

if (typeof window !== 'undefined') {
  restoreSession();
  window.addEventListener('pagehide', saveSession);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveSession();
  });
}

// Ajustes persistidos
youtubeService.setVolume(settings.volume);
if (settings.playbackRate !== 1) youtubeService.setPlaybackRate(settings.playbackRate);
const savedEq = EQ_PRESETS.find((p) => p.id === settings.eqPreset);
if (savedEq && savedEq.id !== 'flat') youtubeService.setEqualizer(savedEq);

// ---------------------------------------------------------------------------
// Actualización diferida (nueva versión desplegada)
// ---------------------------------------------------------------------------

let pendingUpdate = false;

/** Recarga la app para aplicar un despliegue, sin cortar nunca la música. */
export function requestAppUpdate() {
  pendingUpdate = true;
  maybeApplyPendingUpdate();
}

function maybeApplyPendingUpdate() {
  const { isPlaying, isLoading } = get();
  if (!pendingUpdate || isPlaying || isLoading) return;
  saveSession();
  window.location.reload();
}

playerStore.subscribe(maybeApplyPendingUpdate);

// ---------------------------------------------------------------------------
// Acciones públicas
// ---------------------------------------------------------------------------

export function playSong(song: Song, contextQueue?: Song[]) {
  youtubeService.unlockAudio(); // síncrono dentro del gesto (Safari)
  consecutiveFailures = 0;

  const { queue, isShuffle } = get();
  let newQueue = contextQueue ? [...contextQueue] : queue.length > 0 ? [...queue] : [song];
  let index = newQueue.findIndex((s) => s.id === song.id);
  if (index === -1) {
    newQueue = [song, ...newQueue];
    index = 0;
  }
  if (isShuffle && newQueue.length > 1) {
    // True Shuffle: la canción elegida primero, el resto con Fisher-Yates
    newQueue = [newQueue[index], ...fisherYates(newQueue.filter((_, i) => i !== index))];
    index = 0;
  }

  set({ queue: newQueue, queueIndex: index });
  void startTrack(newQueue[index]);
}

export function playQueueIndex(index: number) {
  youtubeService.unlockAudio();
  playAtIndex(index);
}

export function togglePlay() {
  const { currentSong, isPlaying, playbackError } = get();
  if (!currentSong) return;
  youtubeService.unlockAudio();

  if (playbackError || resumeAt !== null) {
    void startTrack(currentSong, resumeAt ?? 0); // reintento o sesión restaurada
    return;
  }
  if (isPlaying) {
    clearStartingGuard();
    youtubeService.pause();
    set({ isPlaying: false, isLoading: false });
  } else {
    armStartingGuard(4000);
    youtubeService.play();
    set({ isPlaying: true });
  }
}

export function seek(seconds: number) {
  const target = Math.max(0, seconds);
  progressStore.set({ currentTime: target });
  if (resumeAt !== null) resumeAt = target;
  else youtubeService.seekTo(target);
}

export function nextTrack() {
  const { queue, queueIndex, repeatMode } = get();
  youtubeService.unlockAudio();
  if (queueIndex < queue.length - 1) playAtIndex(queueIndex + 1);
  else if (repeatMode === 'all' && queue.length > 0) playAtIndex(0);
}

export function prevTrack() {
  youtubeService.unlockAudio();
  if (progressStore.get().currentTime > 3) {
    seek(0);
    return;
  }
  const { queueIndex } = get();
  if (queueIndex > 0) playAtIndex(queueIndex - 1);
  else seek(0);
}

let volumeSaveTimer: ReturnType<typeof setTimeout> | null = null;

export function setVolume(vol: number) {
  const volume = Math.max(0, Math.min(100, Math.round(vol)));
  set({ volume, isMuted: false });
  youtubeService.setVolume(volume);
  // Persistencia con debounce: arrastrar el slider no escribe 60 veces/s
  if (volumeSaveTimer) clearTimeout(volumeSaveTimer);
  volumeSaveTimer = setTimeout(() => updateSettings({ volume }), 400);
}

export function toggleMute() {
  set({ isMuted: !get().isMuted });
  youtubeService.setVolume(effectiveVolume());
}

export function toggleShuffle() {
  const { isShuffle, queue, queueIndex } = get();
  const next = !isShuffle;
  updateSettings({ trueShuffle: next });
  if (next && queue.length > 1) {
    const played = queue.slice(0, queueIndex + 1);
    set({ isShuffle: next, queue: [...played, ...fisherYates(queue.slice(queueIndex + 1))] });
  } else {
    set({ isShuffle: next });
  }
}

export function cycleRepeatMode() {
  const order: RepeatMode[] = ['off', 'all', 'one'];
  set({ repeatMode: order[(order.indexOf(get().repeatMode) + 1) % order.length] });
}

export function setPlaybackRate(rate: number) {
  set({ playbackRate: rate });
  youtubeService.setPlaybackRate(rate);
  updateSettings({ playbackRate: rate });
}

/** minutos, `'end'` (al acabar la canción) o `null` para cancelar. */
export function setSleepTimer(minutes: number | 'end' | null) {
  if (minutes === 'end') {
    set({ sleepAtTrackEnd: true, sleepEndsAt: null });
    return;
  }
  set({ sleepAtTrackEnd: false, sleepEndsAt: minutes === null ? null : Date.now() + minutes * 60_000 });
  if (minutes !== null) runSleepTimer();
}

export function addToQueue(song: Song) {
  const { queue, currentSong } = get();
  if (!currentSong) {
    playSong(song, [song]);
    return;
  }
  set({ queue: [...queue, song] });
}

export function playNextInQueue(song: Song) {
  const { queue, queueIndex, currentSong } = get();
  if (!currentSong) {
    playSong(song, [song]);
    return;
  }
  const copy = [...queue];
  copy.splice(queueIndex + 1, 0, song);
  set({ queue: copy });
  prefetchSong(song);
}

export function removeFromQueue(index: number) {
  const { queue, queueIndex } = get();
  if (index === queueIndex) return;
  set({
    queue: queue.filter((_, i) => i !== index),
    queueIndex: index < queueIndex ? queueIndex - 1 : queueIndex,
  });
}

/** Mueve una canción próxima una posición arriba/abajo dentro de la cola. */
export function moveInQueue(index: number, direction: -1 | 1) {
  const { queue, queueIndex } = get();
  const target = index + direction;
  if (index <= queueIndex || target <= queueIndex || target >= queue.length) return;
  const copy = [...queue];
  [copy[index], copy[target]] = [copy[target], copy[index]];
  set({ queue: copy });
}

export function clearUpcomingQueue() {
  const { queue, queueIndex } = get();
  set({ queue: queue.slice(0, queueIndex + 1) });
}

export const playerActions = {
  playSong,
  playQueueIndex,
  togglePlay,
  seek,
  nextTrack,
  prevTrack,
  setVolume,
  toggleMute,
  toggleShuffle,
  cycleRepeatMode,
  setPlaybackRate,
  setSleepTimer,
  addToQueue,
  playNextInQueue,
  removeFromQueue,
  moveInQueue,
  clearUpcomingQueue,
};
