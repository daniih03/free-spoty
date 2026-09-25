import { getCustomBackendUrl } from './config';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

/** Estados normalizados (mismos códigos que YT.PlayerState). */
export const PlayerStates = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
} as const;

export type PlayerStateChangeHandler = (state: number) => void;
export type PlayerErrorHandler = (errorCode: number) => void;

export interface EqGains {
  bass: number; // dB, -12..12
  mid: number;
  treble: number;
}

const CONTAINER_ID = 'free-spoty-yt-player';

/** Trazas del motor: activar con localStorage.free_spoty_debug = '1'. */
const DEBUG = (() => {
  try {
    return localStorage.getItem('free_spoty_debug') === '1';
  } catch {
    return false;
  }
})();
const debug = (...args: unknown[]) => DEBUG && console.info('[AudioEngine]', ...args);
const STREAM_FALLBACK_MS = 3500;
const WATCHDOG_MS = 3000;

/**
 * Motor de audio híbrido:
 *  1. Servidor propio configurado → <audio> HTML5 nativo (0 anuncios), con
 *     fallback automático al iframe si no arranca en 3,5 s.
 *  2. Por defecto → YouTube IFrame API.
 *
 * Reglas heredadas (ver docs/troubleshooting-and-lessons.md):
 *  - El contenedor del iframe es visible para el navegador (opacity 1) pero
 *    queda detrás de la app (z-index -9999). Nunca usar opacity ~0 ni 0x0.
 *  - Watchdog: si a los 3 s sigue en buffering/pausa, se re-lanza playVideo().
 */
class AudioEngine {
  private player: any = null;
  private playerReady = false;
  private pendingVideoId: string | null = null;
  private pendingStart = 0;
  private pendingAutoplay = true;
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private streamTimer: ReturnType<typeof setTimeout> | null = null;

  private audio: HTMLAudioElement | null = null;
  private usingHtmlAudio = false;
  private htmlVideoId: string | null = null;

  private volume = 100;
  private rate = 1;

  // Ecualizador Web Audio (solo modo <audio>, activación opcional)
  private audioCtx: AudioContext | null = null;
  private filters: BiquadFilterNode[] = [];

  private stateListeners = new Set<PlayerStateChangeHandler>();
  private errorListeners = new Set<PlayerErrorHandler>();

  constructor() {
    if (typeof window === 'undefined') return;
    this.initHtmlAudio();
    this.initIframeApi();
  }

  // -------------------------------------------------------------------------
  // Inicialización
  // -------------------------------------------------------------------------

  private emit(state: number) {
    debug('state', state, this.usingHtmlAudio ? '(html)' : '(iframe)');
    this.stateListeners.forEach((fn) => fn(state));
  }

  private initHtmlAudio() {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');

    const whenActive = (fn: () => void) => () => {
      if (this.usingHtmlAudio) fn();
    };

    audio.addEventListener('playing', whenActive(() => {
      this.clearStreamTimer();
      this.emit(PlayerStates.PLAYING);
    }));
    audio.addEventListener('pause', whenActive(() => this.emit(PlayerStates.PAUSED)));
    audio.addEventListener('ended', whenActive(() => this.emit(PlayerStates.ENDED)));
    audio.addEventListener('waiting', whenActive(() => this.emit(PlayerStates.BUFFERING)));
    audio.addEventListener('canplay', () => this.clearStreamTimer());
    audio.addEventListener('error', whenActive(() => {
      console.warn('[AudioEngine] Error en stream del servidor → iframe de YouTube');
      this.fallbackToIframe();
    }));

    this.audio = audio;
  }

  private initIframeApi() {
    if (window.YT?.Player) {
      this.createPlayer();
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      this.createPlayer();
    };
    if (!document.getElementById('yt-iframe-script')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.head.appendChild(tag);
    }
  }

  private createPlayer() {
    if (this.player) return;
    let container = document.getElementById(CONTAINER_ID);
    if (!container) {
      container = document.createElement('div');
      container.id = CONTAINER_ID;
      Object.assign(container.style, {
        position: 'fixed',
        bottom: '0px',
        right: '0px',
        width: '200px',
        height: '120px',
        opacity: '1', // visible para las políticas de autoplay
        pointerEvents: 'none', // no intercepta clics
        zIndex: '-9999', // oculto tras la app
      });
      document.body.appendChild(container);
    }

    try {
      this.player = new window.YT.Player(CONTAINER_ID, {
        height: '120',
        width: '200',
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          iv_load_policy: 3,
          enablejsapi: 1,
          origin: window.location.origin,
          widget_referrer: window.location.href,
        },
        events: {
          onReady: () => {
            debug('iframe ready, pendiente:', this.pendingVideoId);
            this.playerReady = true;
            this.player.setVolume?.(this.volume);
            if (this.pendingVideoId && !this.usingHtmlAudio) {
              this.loadIframe(this.pendingVideoId, this.pendingStart, this.pendingAutoplay);
            }
          },
          onStateChange: (event: any) => {
            if (this.usingHtmlAudio) return;
            if (event.data === PlayerStates.PLAYING || event.data === PlayerStates.PAUSED) this.clearWatchdog();
            this.emit(event.data);
          },
          onError: (event: any) => {
            if (this.usingHtmlAudio) return;
            console.warn('[YouTube] error', event.data);
            this.clearWatchdog();
            this.errorListeners.forEach((fn) => fn(event.data));
          },
        },
      });
    } catch (e) {
      console.error('No se pudo crear el reproductor de YouTube:', e);
    }
  }

  private clearWatchdog() {
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
    this.watchdogTimer = null;
  }

  private clearStreamTimer() {
    if (this.streamTimer) clearTimeout(this.streamTimer);
    this.streamTimer = null;
  }

  private call(method: string, ...args: unknown[]): any {
    try {
      return this.player?.[method]?.(...args);
    } catch (e) {
      console.warn(`[YouTube] ${method}`, e);
      return undefined;
    }
  }

  // -------------------------------------------------------------------------
  // Carga de pistas
  // -------------------------------------------------------------------------

  private loadIframe(videoId: string, startSeconds: number, autoplay: boolean) {
    debug('loadIframe', videoId, { startSeconds, autoplay, ready: this.playerReady });
    this.pendingVideoId = videoId;
    this.pendingStart = startSeconds;
    this.pendingAutoplay = autoplay;
    if (!this.player || !this.playerReady) return; // onReady la cargará

    if (autoplay) this.call('loadVideoById', { videoId, startSeconds });
    else this.call('cueVideoById', { videoId, startSeconds });
    this.pendingVideoId = null;

    this.clearWatchdog();
    if (!autoplay) return;
    this.call('playVideo');
    this.watchdogTimer = setTimeout(() => {
      const state = this.call('getPlayerState');
      if (state === PlayerStates.BUFFERING || state === PlayerStates.UNSTARTED || state === PlayerStates.PAUSED) {
        console.warn('[Watchdog] Audio atascado, relanzando reproducción');
        this.call('playVideo');
      }
    }, WATCHDOG_MS);
  }

  private fallbackToIframe() {
    this.clearStreamTimer();
    const videoId = this.htmlVideoId;
    const start = this.audio && this.audio.currentTime > 0 ? this.audio.currentTime : this.pendingStart;
    this.usingHtmlAudio = false;
    this.htmlVideoId = null;
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
    }
    if (videoId) this.loadIframe(videoId, start, true);
  }

  public loadVideo(videoId: string, startSeconds = 0, autoplay = true) {
    this.clearStreamTimer();
    this.clearWatchdog();

    const backend = getCustomBackendUrl();
    if (backend && this.audio) {
      this.usingHtmlAudio = true;
      this.call('pauseVideo');
      this.htmlVideoId = videoId;
      this.pendingStart = startSeconds;

      const audio = this.audio;
      if (this.audioCtx) audio.crossOrigin = 'anonymous';
      audio.src = `${backend}/api/stream?id=${encodeURIComponent(videoId)}`;
      audio.playbackRate = this.rate;
      if (startSeconds > 0) audio.currentTime = startSeconds;
      this.emit(PlayerStates.BUFFERING);

      // Si el stream no arranca a tiempo → iframe instantáneo
      this.streamTimer = setTimeout(() => {
        if (this.usingHtmlAudio && audio.paused && audio.currentTime === 0) {
          console.warn('[AudioEngine] Stream lento → iframe de YouTube');
          this.fallbackToIframe();
        }
      }, STREAM_FALLBACK_MS);

      if (autoplay) {
        audio.play().catch(() => {
          // Autoplay diferido hasta tener datos
          audio.addEventListener('canplay', () => audio.play().catch(() => {}), { once: true });
        });
      }
      return;
    }

    this.usingHtmlAudio = false;
    this.audio?.pause();
    this.loadIframe(videoId, startSeconds, autoplay);
  }

  // -------------------------------------------------------------------------
  // Transporte
  // -------------------------------------------------------------------------

  /** Llamar de forma síncrona dentro del gesto del usuario (Safari). */
  public unlockAudio() {
    if (this.audioCtx?.state === 'suspended') this.audioCtx.resume().catch(() => {});
    if (!this.player) this.initIframeApi();
  }

  public play() {
    if (this.usingHtmlAudio && this.audio) {
      this.audio.play().catch(() => this.fallbackToIframe());
      return;
    }
    if (this.pendingVideoId && this.playerReady) {
      this.loadIframe(this.pendingVideoId, this.pendingStart, true);
      return;
    }
    this.call('playVideo');
  }

  public pause() {
    if (this.usingHtmlAudio && this.audio) {
      this.audio.pause();
      return;
    }
    this.call('pauseVideo');
  }

  public stop() {
    this.clearWatchdog();
    this.clearStreamTimer();
    this.audio?.pause();
    this.call('stopVideo');
  }

  public seekTo(seconds: number) {
    if (this.usingHtmlAudio && this.audio) {
      this.audio.currentTime = seconds;
      return;
    }
    this.call('seekTo', seconds, true);
  }

  public setVolume(volume: number) {
    this.volume = Math.min(100, Math.max(0, Math.round(volume)));
    if (this.audio) this.audio.volume = this.volume / 100;
    this.call('setVolume', this.volume);
  }

  public setPlaybackRate(rate: number) {
    this.rate = rate;
    if (this.audio) this.audio.playbackRate = rate;
    this.call('setPlaybackRate', rate);
  }

  public getCurrentTime(): number {
    if (this.usingHtmlAudio && this.audio) return this.audio.currentTime || 0;
    return this.call('getCurrentTime') || 0;
  }

  public getDuration(): number {
    if (this.usingHtmlAudio && this.audio) {
      const d = this.audio.duration;
      return Number.isFinite(d) ? d : 0;
    }
    return this.call('getDuration') || 0;
  }

  public isHtmlAudioMode(): boolean {
    return this.usingHtmlAudio;
  }

  // -------------------------------------------------------------------------
  // Ecualizador (Web Audio, solo con servidor de audio propio)
  // -------------------------------------------------------------------------

  /**
   * El iframe de YouTube es cross-origin y su audio no es accesible, por lo que
   * el EQ solo actúa sobre el <audio> nativo del servidor propio. El grafo Web
   * Audio se crea bajo demanda (preset ≠ plano) para no arriesgar la
   * reproducción en segundo plano de iOS cuando no se usa.
   */
  public setEqualizer(gains: EqGains) {
    const isFlat = gains.bass === 0 && gains.mid === 0 && gains.treble === 0;
    if (isFlat && !this.audioCtx) return;
    if (!this.audioCtx) this.buildAudioGraph();
    const [low, mid, high] = this.filters;
    if (low) low.gain.value = gains.bass;
    if (mid) mid.gain.value = gains.mid;
    if (high) high.gain.value = gains.treble;
  }

  private buildAudioGraph() {
    if (!this.audio) return;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    try {
      const ctx: AudioContext = new Ctx();
      // Necesario para leer muestras de un origen distinto (el servidor envía CORS *)
      const wasPlaying = this.usingHtmlAudio && !this.audio.paused;
      const resumeAt = this.audio.currentTime;
      this.audio.crossOrigin = 'anonymous';
      const source = ctx.createMediaElementSource(this.audio);
      const specs: [BiquadFilterType, number][] = [
        ['lowshelf', 200],
        ['peaking', 1000],
        ['highshelf', 4000],
      ];
      this.filters = specs.map(([type, frequency]) => {
        const f = ctx.createBiquadFilter();
        f.type = type;
        f.frequency.value = frequency;
        return f;
      });
      const last = this.filters.reduce<AudioNode>((prev, node) => {
        prev.connect(node);
        return node;
      }, source);
      last.connect(ctx.destination);
      this.audioCtx = ctx;
      ctx.resume().catch(() => {});

      // El stream actual se cargó sin CORS: se recarga para que el EQ lo procese
      if (wasPlaying && this.htmlVideoId) this.loadVideo(this.htmlVideoId, resumeAt, true);
    } catch (e) {
      console.warn('[EQ] Web Audio no disponible:', e);
    }
  }

  // -------------------------------------------------------------------------
  // Eventos
  // -------------------------------------------------------------------------

  public onStateChange(listener: PlayerStateChangeHandler) {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  public onError(listener: PlayerErrorHandler) {
    this.errorListeners.add(listener);
    return () => {
      this.errorListeners.delete(listener);
    };
  }
}

export const youtubeService = new AudioEngine();
