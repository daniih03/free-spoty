import type { Song } from '../types/music';
import { FEATURED_PLAYLISTS } from './exploreData';
import { getCustomApiKey, getCustomBackendUrl } from './config';
import { itunesTrackToSong } from './itunes';
import { fetchJson, raceFirst, TtlCache, dedupe, safeStorage } from '../lib/net';
import { cleanTitle, songKey } from '../lib/format';

// ===========================================================================
// 1. Búsqueda de metadatos (iTunes Search API)
// ===========================================================================

const FEATURED_SONGS: Song[] = FEATURED_PLAYLISTS.flatMap((p) => p.songs);
const searchCache = new TtlCache<Song[]>(5 * 60_000, 50);

/**
 * Búsqueda rápida con metadatos ricos (carátulas 600x600, duración exacta).
 * Resultados cacheados 5 min: volver a una búsqueda anterior es instantáneo.
 */
export async function searchSongsMetadata(query: string, signal?: AbortSignal): Promise<Song[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const q = trimmed.toLowerCase();

  const cached = searchCache.get(q);
  if (cached) return cached;

  const localMatches = FEATURED_SONGS.filter(
    (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
  );

  try {
    const data = await fetchJson(
      `https://itunes.apple.com/search?term=${encodeURIComponent(trimmed)}&entity=song&limit=30`,
      { timeoutMs: 6000, signal }
    );

    const seen = new Set(localMatches.map((s) => songKey(s.title, s.artist)));
    const combined = [...localMatches];
    for (const item of data.results || []) {
      if (!item.trackId || !item.trackName) continue;
      const song = itunesTrackToSong(item);
      const key = songKey(song.title, song.artist);
      if (seen.has(key)) continue;
      seen.add(key);
      combined.push(song);
    }

    searchCache.set(q, combined);
    return combined;
  } catch (err: any) {
    if (err?.name === 'AbortError' || signal?.aborted) throw err;
    console.warn('Búsqueda de metadatos: fallback local', err);
    return localMatches;
  }
}

// ===========================================================================
// 2. Resolución de audio (Canción → IDs de vídeo de YouTube)
// ===========================================================================

interface Candidate {
  id: string;
  duration?: number; // segundos, si la fuente lo aporta
}

// Instancias verificadas con CORS abierto (Access-Control-Allow-Origin: *).
// Una instancia sin CORS falla siempre en el navegador: verificar antes de añadir.
const PIPED_INSTANCES = ['https://api.piped.private.coffee', 'https://pipedapi.ducks.party'];
const INVIDIOUS_INSTANCES = ['https://invidious.f5.si'];
const VIDEO_ID_RE = /^[\w-]{11}$/;

function nonEmpty(list: Candidate[], source: string): Candidate[] {
  const valid = list.filter((c) => VIDEO_ID_RE.test(c.id));
  if (valid.length === 0) throw new Error(`Sin resultados en ${source}`);
  return valid;
}

async function fromBackend(base: string, q: string): Promise<Candidate[]> {
  const data = await fetchJson(`${base}/api/search?q=${encodeURIComponent(q)}`, { timeoutMs: 3500 });
  return nonEmpty(
    (data.results || []).map((r: any) => ({ id: r.videoId, duration: r.duration })),
    'backend'
  );
}

async function fromYouTubeApi(key: string, q: string): Promise<Candidate[]> {
  const data = await fetchJson(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=6&type=video&videoEmbeddable=true&q=${encodeURIComponent(q)}&key=${key}`,
    { timeoutMs: 3500 }
  );
  return nonEmpty((data.items || []).map((i: any) => ({ id: i?.id?.videoId })), 'YouTube API');
}

async function fromPiped(base: string, q: string): Promise<Candidate[]> {
  const data = await fetchJson(`${base}/search?q=${encodeURIComponent(q)}&filter=videos`, { timeoutMs: 3500 });
  return nonEmpty(
    (data.items || [])
      .filter((i: any) => typeof i?.url === 'string' && i.url.includes('/watch?v='))
      .map((i: any) => ({ id: i.url.split('v=')[1].split('&')[0], duration: i.duration })),
    base
  );
}

async function fromInvidious(base: string, q: string): Promise<Candidate[]> {
  const data = await fetchJson(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video`, { timeoutMs: 3500 });
  return nonEmpty(
    (Array.isArray(data) ? data : []).slice(0, 8).map((i: any) => ({ id: i.videoId, duration: i.lengthSeconds })),
    base
  );
}

/**
 * Busca candidatos de vídeo. Prioridad: servidor propio → API Key → carrera
 * paralela entre todas las instancias públicas (gana la primera que responda).
 */
async function searchCandidates(q: string): Promise<Candidate[]> {
  const backend = getCustomBackendUrl();
  if (backend) {
    try {
      return await fromBackend(backend, q);
    } catch {
      /* continúa con fuentes públicas */
    }
  }

  const apiKey = getCustomApiKey();
  if (apiKey) {
    try {
      return await fromYouTubeApi(apiKey, q);
    } catch (e) {
      console.warn('YouTube API falló:', e);
    }
  }

  try {
    return await raceFirst([
      ...PIPED_INSTANCES.map((b) => fromPiped(b, q)),
      ...INVIDIOUS_INSTANCES.map((b) => fromInvidious(b, q)),
    ]);
  } catch {
    return [];
  }
}

/**
 * Ordena candidatos: respeta el orden de la búsqueda (pista de audio primero)
 * pero penaliza vídeos cuya duración no cuadra con la oficial de iTunes
 * (videoclips con intros largas, bucles de 1 hora, versiones en vivo…).
 */
function rankCandidates(candidates: Candidate[], targetDuration: number): string[] {
  const unique = new Map<string, Candidate>();
  for (const c of candidates) if (!unique.has(c.id)) unique.set(c.id, c);

  return [...unique.values()]
    .map((c, index) => {
      let penalty = 0;
      if (targetDuration > 0 && c.duration && c.duration > 0) {
        const diff = Math.abs(c.duration - targetDuration);
        penalty = diff <= 10 ? 0 : diff <= 30 ? 2 : 12;
      }
      return { id: c.id, score: index + penalty };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 6)
    .map((c) => c.id);
}

// ---------------------------------------------------------------------------
// Caché persistente de resoluciones (sobrevive a recargas: 2ª reproducción = 0 ms)
// ---------------------------------------------------------------------------

const RESOLVE_CACHE_KEY = 'free_spoty_resolve_cache';
const RESOLVE_TTL = 7 * 24 * 3600_000;
const RESOLVE_MAX = 400;

type ResolveEntry = { ids: string[]; t: number };
let resolveCache: Map<string, ResolveEntry> | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function getResolveCache(): Map<string, ResolveEntry> {
  if (!resolveCache) {
    const now = Date.now();
    const raw = safeStorage.get<Record<string, ResolveEntry>>(RESOLVE_CACHE_KEY, {});
    resolveCache = new Map(Object.entries(raw).filter(([, e]) => now - e.t < RESOLVE_TTL && e.ids?.length));
    // Canciones destacadas con IDs verificados
    for (const s of FEATURED_SONGS) {
      if (!s.youtubeId) continue;
      const ids = s.candidateVideoIds?.length ? s.candidateVideoIds : [s.youtubeId];
      resolveCache.set(songKey(s.title, s.artist), { ids, t: now });
    }
  }
  return resolveCache;
}

function persistResolveCache() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    const entries = [...getResolveCache().entries()].slice(-RESOLVE_MAX);
    safeStorage.set(RESOLVE_CACHE_KEY, Object.fromEntries(entries));
  }, 1000);
}

function withIds(song: Song, ids: string[]): Song {
  return {
    ...song,
    youtubeId: ids[0] || '',
    candidateVideoIds: ids,
    currentVersion: 'radio',
  };
}

const resolveInternal = dedupe(
  (song: Song) => songKey(song.title, song.artist),
  async (song: Song): Promise<Song> => {
    const key = songKey(song.title, song.artist);
    const title = cleanTitle(song.title);
    const artist = song.artist.trim();

    // Ambas consultas en paralelo: la pista de audio de estudio (sin intros ni
    // anuncios pre-roll) se prioriza; la búsqueda directa aporta alternativas.
    // No se espera a la más lenta: si "audio" ya tiene resultados, la directa
    // solo dispone de un margen corto para sumar candidatos de respaldo.
    const directPromise = searchCandidates(`${artist} ${title}`);
    const audio = await searchCandidates(`${artist} ${title} audio`);
    const direct = audio.length
      ? await Promise.race([directPromise, new Promise<Candidate[]>((r) => setTimeout(() => r([]), 150))])
      : await directPromise;
    const ids = rankCandidates([...audio, ...direct], song.duration);

    if (ids.length > 0) {
      getResolveCache().set(key, { ids, t: Date.now() });
      persistResolveCache();
    }
    return withIds(song, ids);
  }
);

/** Devuelve la canción con `youtubeId` y candidatos (caché → red). */
export async function resolveSongWithVersions(song: Song, { force = false } = {}): Promise<Song> {
  if (!force) {
    const cached = getResolveCache().get(songKey(song.title, song.artist));
    if (cached) return withIds(song, cached.ids);
  }
  return resolveInternal(song);
}

/** Resolución síncrona si ya está en caché (permite arrancar en el mismo gesto del usuario). */
export function peekResolved(song: Song): Song | null {
  if (song.youtubeId) return song;
  const cached = getResolveCache().get(songKey(song.title, song.artist));
  return cached ? withIds(song, cached.ids) : null;
}

/** Precarga en segundo plano (siguiente canción de la cola). */
export function prefetchSong(song: Song | undefined) {
  if (!song || song.youtubeId || peekResolved(song)) return;
  resolveInternal(song).catch(() => {});
}

/** Descarta un ID que ha fallado para que no vuelva a elegirse primero. */
export function markVideoFailed(song: Song, videoId: string) {
  const cache = getResolveCache();
  const key = songKey(song.title, song.artist);
  const entry = cache.get(key);
  if (!entry) return;
  const ids = entry.ids.filter((id) => id !== videoId);
  if (ids.length) cache.set(key, { ids, t: entry.t });
  else cache.delete(key);
  persistResolveCache();
}
