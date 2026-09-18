declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT: any;
  }
}

export type PlayerStateChangeHandler = (state: number) => void;
export type PlayerErrorHandler = (errorCode: number) => void;

class YouTubeService {
  private player: any = null;
  private htmlAudio: HTMLAudioElement | null = null;
  private isUsingHtmlAudio = false;

  private isApiLoaded = false;
  private isPlayerReady = false;
  private pendingVideoId: string | null = null;
  private pendingAutoplay = false;

  private stateChangeListeners: Set<PlayerStateChangeHandler> = new Set();
  private errorListeners: Set<PlayerErrorHandler> = new Set();
  private containerId = 'yt-hidden-player';

  // Cache direct audio URLs by videoId to save network calls
  private directAudioCache = new Map<string, string>();

  constructor() {
    this.initHtmlAudio();
    this.initApi();
  }

  private initHtmlAudio() {
    if (typeof window === 'undefined') return;

    this.htmlAudio = new Audio();
    this.htmlAudio.preload = 'auto';
    // Mobile background audio & no full-screen takeover
    this.htmlAudio.setAttribute('playsinline', 'true');
    this.htmlAudio.setAttribute('webkit-playsinline', 'true');

    // Forward native HTML5 audio events to state listeners
    this.htmlAudio.addEventListener('playing', () => {
      this.stateChangeListeners.forEach((fn) => fn(1)); // 1 = PLAYING
    });

    this.htmlAudio.addEventListener('pause', () => {
      this.stateChangeListeners.forEach((fn) => fn(2)); // 2 = PAUSED
    });

    this.htmlAudio.addEventListener('ended', () => {
      this.stateChangeListeners.forEach((fn) => fn(0)); // 0 = ENDED
    });

    this.htmlAudio.addEventListener('waiting', () => {
      this.stateChangeListeners.forEach((fn) => fn(3)); // 3 = BUFFERING
    });

    this.htmlAudio.addEventListener('error', (e) => {
      console.warn('HTML5 Audio error, falling back to YouTube iframe:', e);
      this.fallbackToIframe();
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
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.containerId;
      container.style.position = 'fixed';
      container.style.bottom = '-9999px';
      container.style.right = '-9999px';
      container.style.width = '320px';
      container.style.height = '180px';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);
    }

    try {
      this.player = new window.YT.Player(this.containerId, {
        height: '180',
        width: '320',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
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
              this.stateChangeListeners.forEach((fn) => fn(event.data));
            }
          },
          onError: (event: any) => {
            if (!this.isUsingHtmlAudio) {
              console.warn('[YouTube API Error]', event.data);
              this.errorListeners.forEach((fn) => fn(event.data));
            }
          },
        },
      });
    } catch (e) {
      console.error('Failed to initialize YouTube Player:', e);
    }
  }

  /**
   * Fetches the direct audio stream URL from Invidious to completely bypass ads
   * and enable true background playback on mobile with screen locked.
   */
  private async fetchDirectAudioStream(videoId: string): Promise<string | null> {
    if (this.directAudioCache.has(videoId)) {
      return this.directAudioCache.get(videoId)!;
    }

    try {
      const res = await fetch(`https://invidious.f5.si/api/v1/videos/${videoId}`, {
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.adaptiveFormats && Array.isArray(data.adaptiveFormats)) {
          // Find direct audio/mp4 (m4a/AAC stream)
          const audio = data.adaptiveFormats.find(
            (f: any) => f.type && (f.type.startsWith('audio/mp4') || f.type.startsWith('audio/webm'))
          );
          if (audio?.url) {
            this.directAudioCache.set(videoId, audio.url);
            return audio.url;
          }
        }
      }
    } catch {
      // Fallback
    }

    return null;
  }

  private fallbackToIframe() {
    this.isUsingHtmlAudio = false;
    if (this.pendingVideoId && this.player && this.player.loadVideoById) {
      this.player.loadVideoById({
        videoId: this.pendingVideoId,
        startSeconds: 0,
      });
    }
  }

  /**
   * Loads a video: attempts direct 100% ad-free audio stream first,
   * falling back to Iframe only if direct stream cannot be extracted.
   */
  public async loadVideo(videoId: string, startSeconds = 0, autoplay = true) {
    this.pendingVideoId = videoId;
    this.pendingAutoplay = autoplay;

    // Pause any currently playing iframe video
    if (this.player && this.player.pauseVideo) {
      try {
        this.player.pauseVideo();
      } catch {}
    }

    // 1. Attempt Ad-Free Direct Audio Stream (Zero Ads + Lock Screen Playback)
    const directStreamUrl = await this.fetchDirectAudioStream(videoId);

    if (directStreamUrl && this.htmlAudio) {
      try {
        this.isUsingHtmlAudio = true;
        this.htmlAudio.src = directStreamUrl;
        this.htmlAudio.currentTime = startSeconds;
        if (autoplay) {
          const playPromise = this.htmlAudio.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn('Autoplay restricted on mobile until user gesture:', err);
            });
          }
        }
        return;
      } catch (err) {
        console.warn('Direct stream setup failed, falling back to Iframe:', err);
      }
    }

    // 2. Fallback to YouTube Iframe Player
    this.isUsingHtmlAudio = false;
    if (this.htmlAudio) {
      this.htmlAudio.pause();
    }

    if (!this.isPlayerReady || !this.player || !this.player.loadVideoById) {
      return;
    }

    try {
      if (autoplay) {
        this.player.loadVideoById({
          videoId,
          startSeconds,
        });
      } else {
        this.player.cueVideoById({
          videoId,
          startSeconds,
        });
      }
    } catch (err) {
      console.error('Error loading video in YT Player:', err);
    }
  }

  public play() {
    if (this.isUsingHtmlAudio && this.htmlAudio) {
      this.htmlAudio.play().catch(() => {});
      return;
    }

    if (this.player && this.player.playVideo) {
      this.player.playVideo();
    }
  }

  public pause() {
    if (this.isUsingHtmlAudio && this.htmlAudio) {
      this.htmlAudio.pause();
      return;
    }

    if (this.player && this.player.pauseVideo) {
      this.player.pauseVideo();
    }
  }

  public seekTo(seconds: number) {
    if (this.isUsingHtmlAudio && this.htmlAudio) {
      this.htmlAudio.currentTime = seconds;
      return;
    }

    if (this.player && this.player.seekTo) {
      this.player.seekTo(seconds, true);
    }
  }

  public setVolume(volume: number) {
    const clamped = Math.min(100, Math.max(0, volume));

    if (this.htmlAudio) {
      this.htmlAudio.volume = clamped / 100;
    }

    if (this.player && this.player.setVolume) {
      this.player.setVolume(clamped);
    }
  }

  public setPlaybackRate(rate: number) {
    if (this.isUsingHtmlAudio && this.htmlAudio) {
      this.htmlAudio.playbackRate = rate;
      return;
    }

    if (this.player && this.player.setPlaybackRate) {
      this.player.setPlaybackRate(rate);
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
      if (this.htmlAudio.paused) return 2;
      return 1;
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
