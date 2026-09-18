import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Song, VersionType, RepeatMode, SyncedLyricLine } from '../types/music';
import { youtubeService } from '../services/youtube';
import { resolveSongWithVersions, switchSongVersion } from '../services/searchService';
import { fetchLyrics } from '../services/lyricsService';
import { addToPlayHistory, getSettings, updateSettings } from '../services/storageService';

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  playbackRate: number;
  activeVersion: VersionType;
  isLoadingSong: boolean;
  queue: Song[];
  queueIndex: number;
  syncedLyrics: SyncedLyricLine[] | null;
  isLoadingLyrics: boolean;
  sleepTimerSeconds: number | null;
  
  // Actions
  playSong: (song: Song, contextQueue?: Song[]) => Promise<void>;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  setPlaybackRate: (rate: number) => void;
  setSleepTimer: (minutes: number | null) => void;
  switchActiveVersion: (version: VersionType) => Promise<void>;
  addToQueue: (song: Song) => void;
  playNextInQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearUpcomingQueue: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

// Fisher-Yates pure true shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const settings = getSettings();

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(settings.volume);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(settings.trueShuffle);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [activeVersion, setActiveVersion] = useState<VersionType>('radio');
  const [isLoadingSong, setIsLoadingSong] = useState(false);
  
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  
  const [syncedLyrics, setSyncedLyrics] = useState<SyncedLyricLine[] | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState<number | null>(null);

  // References to keep callbacks fresh in event handlers
  const stateRef = useRef({
    currentSong,
    queue,
    queueIndex,
    repeatMode,
    isShuffle,
    volume,
    isMuted
  });
  stateRef.current = { currentSong, queue, queueIndex, repeatMode, isShuffle, volume, isMuted };

  // Sync YouTube player state
  useEffect(() => {
    const unbindState = youtubeService.onStateChange((state) => {
      // YT.PlayerState: 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING
      if (state === 1) {
        setIsPlaying(true);
        setIsLoadingSong(false);
        const dur = youtubeService.getDuration();
        if (dur > 0) setDuration(dur);
      } else if (state === 2) {
        setIsPlaying(false);
      } else if (state === 0) {
        // Track ended
        handleTrackEnded();
      } else if (state === 3) {
        setIsLoadingSong(true);
      }
    });

    const unbindError = youtubeService.onError((code) => {
      console.warn('Player error code:', code);
      setIsLoadingSong(false);
      // If error playing this version, try switching version or go next
      const song = stateRef.current.currentSong;
      if (song) {
        const currVer = song.currentVersion;
        if (currVer === 'radio' && song.availableVersions?.lyrics) {
          switchActiveVersion('lyrics');
        } else if (currVer !== 'original' && song.availableVersions?.original) {
          switchActiveVersion('original');
        } else {
          nextTrack();
        }
      }
    });

    return () => {
      unbindState();
      unbindError();
    };
  }, []);

  // Time tracker loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying) {
        const time = youtubeService.getCurrentTime();
        setCurrentTime(time);
        const dur = youtubeService.getDuration();
        if (dur > 0 && dur !== duration) {
          setDuration(dur);
        }
      }
    }, 250); // 4 times/sec for smooth progress bar and synced lyrics

    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  // Sleep timer interval
  useEffect(() => {
    if (sleepTimerSeconds === null) return;

    const timer = setInterval(() => {
      setSleepTimerSeconds(prev => {
        if (prev === null || prev <= 1) {
          // Time expired! Smooth pause
          youtubeService.pause();
          setIsPlaying(false);
          return null;
        }

        // Smooth fade out in the last 10 seconds
        if (prev <= 10) {
          const fadeVol = Math.max(0, Math.floor((prev / 10) * volume));
          youtubeService.setVolume(fadeVol);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepTimerSeconds, volume]);

  const handleTrackEnded = useCallback(() => {
    const { repeatMode, queue, queueIndex } = stateRef.current;
    if (repeatMode === 'one') {
      youtubeService.seekTo(0);
      youtubeService.play();
      return;
    }

    if (queueIndex < queue.length - 1) {
      playSongAtIndex(queueIndex + 1);
    } else if (repeatMode === 'all' && queue.length > 0) {
      playSongAtIndex(0);
    } else {
      setIsPlaying(false);
    }
  }, []);

  const playSongAtIndex = async (index: number) => {
    const targetQueue = stateRef.current.queue;
    if (index < 0 || index >= targetQueue.length) return;
    setQueueIndex(index);
    await executePlaySong(targetQueue[index]);
  };

  const executePlaySong = async (song: Song) => {
    setIsLoadingSong(true);
    setCurrentTime(0);
    setDuration(song.duration || 0);

    // 1. Resolve versions according to priority (Radio Edit -> Lyrics -> Original)
    const resolvedSong = await resolveSongWithVersions(song);
    setCurrentSong(resolvedSong);
    setActiveVersion(resolvedSong.currentVersion);

    // 2. Play audio in YouTube engine
    if (resolvedSong.youtubeId) {
      youtubeService.loadVideo(resolvedSong.youtubeId, 0, true);
      youtubeService.setVolume(stateRef.current.isMuted ? 0 : stateRef.current.volume);
      setIsPlaying(true);
    } else {
      setIsLoadingSong(false);
      console.warn(`No se encontró audio para "${song.title}" de ${song.artist}`);
    }

    // 3. Add to history
    addToPlayHistory(resolvedSong);

    // 4. Update native lock screen media controls (iOS / Android)
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: resolvedSong.title,
          artist: resolvedSong.artist,
          album: resolvedSong.album || 'Free-Spoty',
          artwork: [
            { src: resolvedSong.coverUrl, sizes: '512x512', type: 'image/jpeg' },
            { src: resolvedSong.coverUrl, sizes: '192x192', type: 'image/jpeg' },
          ],
        });
        navigator.mediaSession.setActionHandler('play', () => togglePlay());
        navigator.mediaSession.setActionHandler('pause', () => togglePlay());
        navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
        navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) seek(details.seekTime);
        });
      } catch {}
    }

    // 4. Fetch synced lyrics
    setIsLoadingLyrics(true);
    fetchLyrics(resolvedSong.title, resolvedSong.artist, resolvedSong.duration)
      .then(lyrics => {
        setSyncedLyrics(lyrics);
        setIsLoadingLyrics(false);
      })
      .catch(() => {
        setSyncedLyrics(null);
        setIsLoadingLyrics(false);
      });
  };

  const playSong = async (song: Song, contextQueue?: Song[]) => {
    let newQueue = contextQueue ? [...contextQueue] : (queue.length > 0 ? [...queue] : [song]);
    let targetIndex = newQueue.findIndex(s => s.id === song.id);

    if (targetIndex === -1) {
      newQueue = [song, ...newQueue];
      targetIndex = 0;
    }

    if (isShuffle) {
      // True shuffle remaining tracks while keeping current song first
      const remaining = newQueue.filter((_, i) => i !== targetIndex);
      const shuffled = shuffleArray(remaining);
      newQueue = [song, ...shuffled];
      targetIndex = 0;
    }

    setQueue(newQueue);
    setQueueIndex(targetIndex);
    await executePlaySong(song);
  };

  const togglePlay = () => {
    if (!currentSong) return;
    if (isPlaying) {
      youtubeService.pause();
      setIsPlaying(false);
    } else {
      youtubeService.play();
      setIsPlaying(true);
    }
  };

  const seek = (seconds: number) => {
    setCurrentTime(seconds);
    youtubeService.seekTo(seconds);
  };

  const nextTrack = () => {
    const { queue, queueIndex, repeatMode } = stateRef.current;
    if (queueIndex < queue.length - 1) {
      playSongAtIndex(queueIndex + 1);
    } else if (repeatMode === 'all' && queue.length > 0) {
      playSongAtIndex(0);
    }
  };

  const prevTrack = () => {
    // If we are more than 3 seconds into the track, restart it
    if (currentTime > 3) {
      seek(0);
      return;
    }
    const { queueIndex } = stateRef.current;
    if (queueIndex > 0) {
      playSongAtIndex(queueIndex - 1);
    } else {
      seek(0);
    }
  };

  const setVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(100, vol));
    setVolumeState(clamped);
    setIsMuted(false);
    youtubeService.setVolume(clamped);
    updateSettings({ volume: clamped });
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      youtubeService.setVolume(volume);
    } else {
      setIsMuted(true);
      youtubeService.setVolume(0);
    }
  };

  const toggleShuffle = () => {
    const nextShuffle = !isShuffle;
    setIsShuffle(nextShuffle);
    updateSettings({ trueShuffle: nextShuffle });

    if (nextShuffle && queue.length > 1) {
      // True shuffle upcoming songs without disturbing history
      const played = queue.slice(0, queueIndex + 1);
      const upcoming = queue.slice(queueIndex + 1);
      const shuffledUpcoming = shuffleArray(upcoming);
      setQueue([...played, ...shuffledUpcoming]);
    }
  };

  const cycleRepeatMode = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const setPlaybackRate = (rate: number) => {
    setPlaybackRateState(rate);
    youtubeService.setPlaybackRate(rate);
  };

  const setSleepTimer = (minutes: number | null) => {
    if (minutes === null) {
      setSleepTimerSeconds(null);
    } else {
      setSleepTimerSeconds(minutes * 60);
    }
  };

  const switchActiveVersion = async (targetVersion: VersionType) => {
    if (!currentSong || currentSong.currentVersion === targetVersion) return;
    setIsLoadingSong(true);
    const savedTime = currentTime;

    const updated = await switchSongVersion(currentSong, targetVersion);
    setCurrentSong(updated);
    setActiveVersion(targetVersion);

    if (updated.youtubeId) {
      youtubeService.loadVideo(updated.youtubeId, savedTime, isPlaying);
    }
    setIsLoadingSong(false);
  };

  const addToQueue = (song: Song) => {
    setQueue(prev => [...prev, song]);
  };

  const playNextInQueue = (song: Song) => {
    setQueue(prev => {
      const copy = [...prev];
      copy.splice(queueIndex + 1, 0, song);
      return copy;
    });
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    if (index < queueIndex) {
      setQueueIndex(prev => prev - 1);
    }
  };

  const clearUpcomingQueue = () => {
    setQueue(prev => prev.slice(0, queueIndex + 1));
  };

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffle,
        repeatMode,
        playbackRate,
        activeVersion,
        isLoadingSong,
        queue,
        queueIndex,
        syncedLyrics,
        isLoadingLyrics,
        sleepTimerSeconds,
        playSong,
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
        switchActiveVersion,
        addToQueue,
        playNextInQueue,
        removeFromQueue,
        clearUpcomingQueue,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
