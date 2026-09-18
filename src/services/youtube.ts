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
  private isApiLoaded = false;
  private isPlayerReady = false;
  private pendingVideoId: string | null = null;
  private pendingAutoplay = false;
  private stateChangeListeners: Set<PlayerStateChangeHandler> = new Set();
  private errorListeners: Set<PlayerErrorHandler> = new Set();
  private containerId = 'yt-hidden-player';

  constructor() {
    this.initApi();
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
            if (this.pendingVideoId) {
              this.loadVideo(this.pendingVideoId, 0, this.pendingAutoplay);
              this.pendingVideoId = null;
            }
          },
          onStateChange: (event: any) => {
            this.stateChangeListeners.forEach(fn => fn(event.data));
          },
          onError: (event: any) => {
            console.warn('[YouTube API Error]', event.data);
            this.errorListeners.forEach(fn => fn(event.data));
          }
        }
      });
    } catch (e) {
      console.error('Failed to initialize YouTube Player:', e);
    }
  }

  public loadVideo(videoId: string, startSeconds = 0, autoplay = true) {
    if (!this.isPlayerReady || !this.player || !this.player.loadVideoById) {
      this.pendingVideoId = videoId;
      this.pendingAutoplay = autoplay;
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
    if (this.player && this.player.playVideo) {
      this.player.playVideo();
    }
  }

  public pause() {
    if (this.player && this.player.pauseVideo) {
      this.player.pauseVideo();
    }
  }

  public seekTo(seconds: number) {
    if (this.player && this.player.seekTo) {
      this.player.seekTo(seconds, true);
    }
  }

  public setVolume(volume: number) {
    // 0 - 100
    if (this.player && this.player.setVolume) {
      this.player.setVolume(Math.min(100, Math.max(0, volume)));
    }
  }

  public setPlaybackRate(rate: number) {
    if (this.player && this.player.setPlaybackRate) {
      this.player.setPlaybackRate(rate);
    }
  }

  public getCurrentTime(): number {
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
