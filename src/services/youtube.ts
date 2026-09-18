export type PlayerStateChangeHandler = (state: number) => void;
export type PlayerErrorHandler = (errorCode: number) => void;

class YouTubeService {
  private htmlAudio: HTMLAudioElement | null = null;
  private isAudioUnlocked = false;
  private currentVideoId: string | null = null;

  private stateChangeListeners: Set<PlayerStateChangeHandler> = new Set();
  private errorListeners: Set<PlayerErrorHandler> = new Set();

  // Cache direct audio URLs by videoId to save network calls
  private directAudioCache = new Map<string, string>();

  // Instance pool for stream extraction
  private streamInstances: string[] = [
    'invidious.f5.si',
  ];

  constructor() {
    this.initHtmlAudio();
  }

  private initHtmlAudio() {
    if (typeof window === 'undefined') return;

    this.htmlAudio = new Audio();
    this.htmlAudio.preload = 'auto';
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
      console.warn('Audio stream playback error:', e);
      this.errorListeners.forEach((fn) => fn(100));
    });
  }

  /**
   * Synchronously unlocks audio playback in Safari WebKit upon user touch.
   * This is critical for iOS Safari to allow subsequent async playback.
   */
  public unlockAudio() {
    if (!this.htmlAudio || this.isAudioUnlocked) return;
    try {
      this.htmlAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      const p = this.htmlAudio.play();
      if (p !== undefined) {
        p.then(() => {
          this.isAudioUnlocked = true;
        }).catch(() => {});
      }
    } catch {}
  }

  /**
   * Fetches the direct ad-free audio stream URL.
   */
  private async fetchDirectAudioStream(videoId: string): Promise<string | null> {
    if (this.directAudioCache.has(videoId)) {
      return this.directAudioCache.get(videoId)!;
    }

    for (const domain of this.streamInstances) {
      try {
        const res = await fetch(`https://${domain}/api/v1/videos/${videoId}`, {
          signal: AbortSignal.timeout(4500),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.adaptiveFormats && Array.isArray(data.adaptiveFormats)) {
            // Find direct audio/mp4 (AAC stereo stream)
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
        // Try next instance
      }
    }

    return null;
  }

  /**
   * Loads and plays a song using pure ad-free HTML5 audio.
   * Zero ads guaranteed: never runs an invisible YouTube iframe.
   */
  public async loadVideo(videoId: string, startSeconds = 0, autoplay = true) {
    this.currentVideoId = videoId;

    if (!this.htmlAudio) return;

    // Reset audio before loading new track
    this.htmlAudio.pause();

    // Signal buffering to UI
    this.stateChangeListeners.forEach((fn) => fn(3));

    const directStreamUrl = await this.fetchDirectAudioStream(videoId);

    if (directStreamUrl && this.htmlAudio) {
      try {
        this.htmlAudio.src = directStreamUrl;
        this.htmlAudio.currentTime = startSeconds;

        if (autoplay) {
          const playPromise = this.htmlAudio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                this.stateChangeListeners.forEach((fn) => fn(1)); // PLAYING
              })
              .catch((err) => {
                console.warn('Autoplay restricted by browser, ready for user tap:', err);
                this.stateChangeListeners.forEach((fn) => fn(2)); // PAUSED (user can tap play)
              });
          }
        }
        return;
      } catch (err) {
        console.warn('Error playing audio stream:', err);
        this.errorListeners.forEach((fn) => fn(100));
      }
    } else {
      console.warn('Could not extract direct audio stream for videoId:', videoId);
      this.errorListeners.forEach((fn) => fn(100));
    }
  }

  public play() {
    if (this.htmlAudio) {
      this.htmlAudio.play().catch((err) => {
        console.warn('Play error:', err);
      });
    }
  }

  public pause() {
    if (this.htmlAudio) {
      this.htmlAudio.pause();
    }
  }

  public seekTo(seconds: number) {
    if (this.htmlAudio) {
      this.htmlAudio.currentTime = seconds;
    }
  }

  public setVolume(volume: number) {
    const clamped = Math.min(100, Math.max(0, volume));
    if (this.htmlAudio) {
      this.htmlAudio.volume = clamped / 100;
    }
  }

  public setPlaybackRate(rate: number) {
    if (this.htmlAudio) {
      this.htmlAudio.playbackRate = rate;
    }
  }

  public getCurrentTime(): number {
    return this.htmlAudio?.currentTime || 0;
  }

  public getDuration(): number {
    return this.htmlAudio?.duration || 0;
  }

  public getPlayerState(): number {
    if (!this.htmlAudio) return -1;
    if (this.htmlAudio.paused) return 2;
    return 1;
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
