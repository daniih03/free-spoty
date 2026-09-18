import { useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';

interface UseKeyboardShortcutsOptions {
  onToggleLyrics?: () => void;
  onFocusSearch?: () => void;
}

export function useKeyboardShortcuts(options?: UseKeyboardShortcutsOptions) {
  const {
    currentSong,
    togglePlay,
    seek,
    currentTime,
    duration,
    nextTrack,
    prevTrack,
    volume,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode
  } = usePlayer();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if focused on input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          togglePlay();
          break;

        case 'j':
        case 'J':
          e.preventDefault();
          seek(Math.max(0, currentTime - 5));
          break;

        case 'l':
        case 'L':
          e.preventDefault();
          seek(Math.min(duration, currentTime + 5));
          break;

        case 'ArrowLeft':
          e.preventDefault();
          prevTrack();
          break;

        case 'ArrowRight':
          e.preventDefault();
          nextTrack();
          break;

        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(100, volume + 5));
          break;

        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 5));
          break;

        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;

        case 's':
        case 'S':
          e.preventDefault();
          toggleShuffle();
          break;

        case 'r':
        case 'R':
          e.preventDefault();
          cycleRepeatMode();
          break;

        case 'f':
        case 'F':
          e.preventDefault();
          options?.onToggleLyrics?.();
          break;

        case '/':
          e.preventDefault();
          options?.onFocusSearch?.();
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentSong,
    togglePlay,
    seek,
    currentTime,
    duration,
    nextTrack,
    prevTrack,
    volume,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
    options
  ]);
}
