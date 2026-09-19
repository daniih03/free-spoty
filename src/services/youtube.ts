declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export type PlayerStateChangeHandler = (state: number) => void;
export type PlayerErrorHandler = (errorCode: number) => void;

export const BACKEND_URL_STORAGE_KEY = 'free_spoty_backend_url';

export function getCustomBackendUrl(): string {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem(BACKEND_URL_STORAGE_KEY) || (import.meta as any).env?.VITE_STREAM_API_URL || '';
  if (stored && stored.includes('onrender.com')) {
    // Clear dormant/slow Render datacenter URL that blocks playback
    localStorage.removeItem(BACKEND_URL_STORAGE_KEY);
    return '';
  }
  return stored;
}

export function setCustomBackendUrl(url: string) {
  if (typeof window === 'undefined') return;
  const clean = url.trim().replace(/\/+$/, '');
  if (clean) {
    localStorage.setItem(BACKEND_URL_STORAGE_KEY, clean);
  } else {
    localStorage.removeItem(BACKEND_URL_STORAGE_KEY);
  }
}

class YouTubeService {
  private player: any = null;
  private isPlayerReady = false;
  private isApiLoaded = false;
  private pendingVideoId: string | null = null;
  private currentVideoId: string | null = null;
  private pendingAutoplay = true;
  private containerId = 'free-spoty-yt-player';
  private watchdogTimer: any = null;
  private streamTimeout: any = null;

  // Native HTML5 audio engine for 100% Ad-Free backend streaming
  private htmlAudio: HTMLAudioElement | null = null;
  private isUsingHtmlAudio = false;

  private stateChangeListeners: Set<PlayerStateChangeHandler> = new Set();
  private errorListeners: Set<PlayerErrorHandler> = new Set();

  constructor() {
    this.initHtmlAudio();
    this.initApi();
  }

  private initHtmlAudio() {
    if (typeof window === 'undefined') return;

    this.htmlAudio = new Audio();
    this.htmlAudio.preload = 'auto';
    this.htmlAudio.setAttribute('playsinline', 'true');
    this.htmlAudio.setAttribute('webkit-playsinline', 'true');

    this.htmlAudio.addEventListener('playing', () => {
      if (this.streamTimeout) {
        clearTimeout(this.streamTimeout);
        this.streamTimeout = null;
      }
      if (this.isUsingHtmlAudio) {
        this.stateChangeListeners.forEach((fn) => fn(1)); // 1 = PLAYING
      }
    });

    this.htmlAudio.addEventListener('pause', () => {
      if (this.isUsingHtmlAudio) {
        this.stateChangeListeners.forEach((fn) => fn(2)); // 2 = PAUSED
      }
    });

    this.htmlAudio.addEventListener('ended', () => {
      if (this.isUsingHtmlAudio) {
        this.stateChangeListeners.forEach((fn) => fn(0)); // 0 = ENDED
      }
    });

    this.htmlAudio.addEventListener('waiting', () => {
      if (this.isUsingHtmlAudio) {
        this.stateChangeListeners.forEach((fn) => fn(3)); // 3 = BUFFERING
      }
    });

    this.htmlAudio.addEventListener('canplay', () => {
      if (this.streamTimeout) {
        clearTimeout(this.streamTimeout);
        this.streamTimeout = null;
      }
    });

    this.htmlAudio.addEventListener('error', (e) => {
      if (this.isUsingHtmlAudio) {
        console.warn('Backend audio stream error, falling back to YouTube player immediately:', e);
        this.fallbackToIframe();
      }
    });
  }

  private initApi() {
    if (typeof window === 'undefined') return;

    if (window.YT && window.YT.Player) {
      this.isApiLoaded = true;
      this.createPlayer();
      return;
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) previousCallback();
      this.isApiLoaded = true;
      this.createPlayer();
    };

    if (!document.getElementById('yt-iframe-script')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }

  private createPlayer() {
    if (typeof window === 'undefined') return;

    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.containerId;
      container.style.position = 'fixed';
      container.style.bottom = '0px';
      container.style.right = '0px';
      container.style.width = '200px';
      container.style.height = '120px';
      container.style.opacity = '1';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '-9999';
      document.body.appendChild(container);
    }

    try {
      this.player = new window.YT.Player(this.containerId, {
        height: '120',
        width: '200',
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
        },
        events: {
          onReady: () => {
            this.isPlayerReady = true;
            if (this.pendingVideoId && !this.isUsingHtmlAudio) {
              this.loadVideo(this.pendingVideoId, 0, this.pendingAutoplay);
              this.pendingVideoId = null;
            }
          },
          onStateChange: (event: any) => {
            if (!this.isUsingHtmlAudio) {
              if (event.data === 1 || event.data === 2) {
                if (this.watchdogTimer) {
                  clearTimeout(this.watchdogTimer);
                  this.watchdogTimer = null;
                }
              }
              this.stateChangeListeners.forEach((fn) => fn(event.data));
            }
          },
          onError: (event: any) => {
            if (!this.isUsingHtmlAudio) {
              console.warn('[YouTube Player Error]', event.data);
              if (this.watchdogTimer) {
                clearTimeout(this.watchdogTimer);
                this.watchdogTimer = null;
              }
              this.errorListeners.forEach((fn) => fn(event.data));
            }
          },
        },
      });
    } catch (e) {
      console.error('Failed to create YouTube player:', e);
    }
  }

  /**
   * Synchronously called on user click/touch to warm up audio session in Safari.
   */
  public unlockAudio() {
    if (!this.player) {
      this.initApi();
    } else if (this.player && this.isPlayerReady && typeof this.player.playVideo === 'function') {
      try {
        const state = typeof this.player.getPlayerState === 'function' ? this.player.getPlayerState() : -1;
        if (state === 2) {
          this.player.playVideo();
        }
      } catch {}
    }
  }

  public fallbackToIframe() {
    if (this.streamTimeout) {
      clearTimeout(this.streamTimeout);
      this.streamTimeout = null;
    }
    this.isUsingHtmlAudio = false;
    if (this.htmlAudio) {
      this.htmlAudio.pause();
      try {
        this.htmlAudio.removeAttribute('src');
        this.htmlAudio.load();
      } catch {}
    }
    if (this.pendingVideoId) {
      if (this.player && this.isPlayerReady && typeof this.player.loadVideoById === 'function') {
        try {
          this.player.loadVideoById({
            videoId: this.pendingVideoId,
            startSeconds: 0,
          });
          if (this.pendingAutoplay && typeof this.player.playVideo === 'function') {
            this.player.playVideo();
          }
        } catch (e) {
          console.warn('fallbackToIframe load error:', e);
        }
      } else if (!this.isPlayerReady) {
        this.initApi();
      }
    }
  }

  public loadVideo(videoId: string, startSeconds = 0, autoplay = true) {
    this.pendingVideoId = videoId;
    this.pendingAutoplay = autoplay;

    if (this.streamTimeout) {
      clearTimeout(this.streamTimeout);
      this.streamTimeout = null;
    }

    const backendUrl = getCustomBackendUrl();

    // 1. If backend URL is set: Play 100% ad-free native audio stream
    if (backendUrl && this.htmlAudio) {
      this.isUsingHtmlAudio = true;

      // Pause Iframe if running
      if (this.player && this.player.pauseVideo) {
        try { this.player.pauseVideo(); } catch {}
      }

      const targetSrc = `${backendUrl}/api/stream?id=${encodeURIComponent(videoId)}`;

      // If already set to this track, simply ensure it is playing without aborting network stream
      if (this.currentVideoId === videoId && this.htmlAudio.src === targetSrc) {
        if (startSeconds > 0) this.htmlAudio.currentTime = startSeconds;
        if (autoplay && this.htmlAudio.paused) {
          this.htmlAudio.play().catch(() => {});
        }
        return;
      }

      this.currentVideoId = videoId;

      // Signal buffering to UI
      this.stateChangeListeners.forEach((fn) => fn(3));

      // Safety fallback: if backend stream does not start playing within 3.5s, switch immediately to YouTube player
      this.streamTimeout = setTimeout(() => {
        if (this.isUsingHtmlAudio && this.htmlAudio && this.htmlAudio.paused && this.htmlAudio.currentTime === 0) {
          console.warn('[Stream Timeout] Audio stream delayed, switching to YouTube player for instant playback...');
          this.fallbackToIframe();
        }
      }, 3500);

      try {
        this.htmlAudio.src = targetSrc;
        this.htmlAudio.currentTime = startSeconds || 0;

        if (autoplay) {
          const p = this.htmlAudio.play();
          if (p !== undefined) {
            p.then(() => {
              if (this.streamTimeout) {
                clearTimeout(this.streamTimeout);
                this.streamTimeout = null;
              }
              this.stateChangeListeners.forEach((fn) => fn(1)); // PLAYING
            }).catch((err) => {
              console.warn('HTML Audio play deferred until stream data arrives:', err);
              // As soon as first audio chunk is buffered, play automatically
              const onCanPlay = () => {
                if (this.streamTimeout) {
                  clearTimeout(this.streamTimeout);
                  this.streamTimeout = null;
                }
                if (this.htmlAudio && autoplay) {
                  this.htmlAudio.play().catch(() => {});
                }
              };
              this.htmlAudio?.addEventListener('canplay', onCanPlay, { once: true });
            });
          }
        }
        return;
      } catch (err) {
        console.warn('Error configuring ad-free audio stream:', err);
        this.fallbackToIframe();
        return;
      }
    }

    // 2. Fallback: YouTube Iframe
    this.isUsingHtmlAudio = false;
    if (this.htmlAudio) {
      this.htmlAudio.pause();
    }

    if (this.player && this.isPlayerReady && this.player.loadVideoById) {
      try {
        this.player.loadVideoById({
          videoId,
          startSeconds: startSeconds || 0,
        });

        if (autoplay && this.player.playVideo) {
          this.player.playVideo();
        }

        if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
        this.watchdogTimer = setTimeout(() => {
          if (this.player && typeof this.player.getPlayerState === 'function') {
            const state = this.player.getPlayerState();
            if (state === 3 || state === -1 || state === 2) {
              console.warn('[YouTube Watchdog] Audio stalled, attempting play kick...');
              try { this.player.playVideo(); } catch {}
            }
          }
        }, 3000);
      } catch (err) {
        console.warn('Error calling loadVideoById:', err);
      }
    }
  }

  public play() {
    if (this.isUsingHtmlAudio && this.htmlAudio) {
      this.htmlAudio.play().catch(() => this.fallbackToIframe());
      return;
    }

    if (this.player && this.player.playVideo) {
      try {
        this.player.playVideo();
      } catch (e) {
        console.warn('playVideo error:', e);
      }
    }
  }

  public pause() {
    if (this.isUsingHtmlAudio && this.htmlAudio) {
      this.htmlAudio.pause();
      return;
    }

    if (this.player && this.player.pauseVideo) {
      try {
        this.player.pauseVideo();
      } catch (e) {
        console.warn('pauseVideo error:', e);
      }
    }
  }

  public seekTo(seconds: number) {
    if (this.isUsingHtmlAudio && this.htmlAudio) {
      this.htmlAudio.currentTime = seconds;
      return;
    }

    if (this.player && this.player.seekTo) {
      try {
        this.player.seekTo(seconds, true);
      } catch (e) {
        console.warn('seekTo error:', e);
      }
    }
  }

  public setVolume(volume: number) {
    const clamped = Math.min(100, Math.max(0, volume));

    if (this.htmlAudio) {
      this.htmlAudio.volume = clamped / 100;
    }

    if (this.player && this.player.setVolume) {
      try {
        this.player.setVolume(clamped);
      } catch (e) {
        console.warn('setVolume error:', e);
      }
    }
  }

  public setPlaybackRate(rate: number) {
    if (this.htmlAudio) {
      this.htmlAudio.playbackRate = rate;
    }

    if (this.player && this.player.setPlaybackRate) {
      try {
        this.player.setPlaybackRate(rate);
      } catch (e) {
        console.warn('setPlaybackRate error:', e);
      }
    }
  }

  public getCurrentTime(): number {
    if (this.isUsingHtmlAudio && this.htmlAudio) {
      return this.htmlAudio.currentTime || 0;
    }

    if (this.player && this.player.getCurrentTime) {
      try {
        return this.player.getCurrentTime() || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }

  public getDuration(): number {
    if (this.isUsingHtmlAudio && this.htmlAudio) {
      return this.htmlAudio.duration || 0;
    }

    if (this.player && this.player.getDuration) {
      try {
        return this.player.getDuration() || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }

  public getPlayerState(): number {
    if (this.isUsingHtmlAudio && this.htmlAudio) {
      return this.htmlAudio.paused ? 2 : 1;
    }

    if (this.player && this.player.getPlayerState) {
      try {
        return this.player.getPlayerState();
      } catch {
        return -1;
      }
    }
    return -1;
  }

  public onStateChange(listener: PlayerStateChangeHandler) {
    this.stateChangeListeners.add(listener);
    return () => {
      this.stateChangeListeners.delete(listener);
    };
  }

  public onError(listener: PlayerErrorHandler) {
    this.errorListeners.add(listener);
    return () => {
      this.errorListeners.delete(listener);
    };
  }
}

export const youtubeService = new YouTubeService();
