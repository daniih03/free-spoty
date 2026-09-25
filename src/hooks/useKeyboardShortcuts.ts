import { useEffect, useRef } from 'react';
import { playerActions, playerStore, progressStore } from '../state/player';
import { ui } from '../state/ui';

interface Options {
  onFocusSearch?: () => void;
}

/**
 * Atajos globales. Se registra una sola vez y lee el estado en el momento de
 * la pulsación (antes se re-registraba 4 veces por segundo con cada tick).
 */
export function useKeyboardShortcuts({ onFocusSearch }: Options = {}) {
  const focusRef = useRef(onFocusSearch);
  focusRef.current = onFocusSearch;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      const time = progressStore.get().currentTime;
      const { duration, volume } = playerStore.get();

      const actions: Record<string, () => void> = {
        ' ': playerActions.togglePlay,
        k: playerActions.togglePlay,
        j: () => playerActions.seek(Math.max(0, time - 5)),
        l: () => playerActions.seek(Math.min(duration, time + 5)),
        arrowleft: playerActions.prevTrack,
        arrowright: playerActions.nextTrack,
        arrowup: () => playerActions.setVolume(volume + 5),
        arrowdown: () => playerActions.setVolume(volume - 5),
        m: playerActions.toggleMute,
        s: playerActions.toggleShuffle,
        r: playerActions.cycleRepeatMode,
        f: ui.toggleLyrics,
        '/': () => focusRef.current?.(),
      };

      const action = actions[e.key.toLowerCase()];
      if (!action) return;
      // Espacio sobre un botón enfocado: dejar el comportamiento nativo del botón
      if (e.key === ' ' && target.tagName === 'BUTTON') return;
      e.preventDefault();
      action();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
