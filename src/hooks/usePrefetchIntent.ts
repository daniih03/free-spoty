import { useMemo, useRef } from 'react';
import type { Song } from '../types/music';
import { prefetchSong } from '../services/searchService';
import { getCustomBackendUrl } from '../services/config';

/**
 * Precarga por intención: al posar el cursor 250 ms o al tocar una tarjeta,
 * se resuelve la canción y el servidor propio extrae ya su audio, de modo que
 * al hacer clic suena al instante. Solo con servidor propio (no se cargan las
 * instancias públicas con peticiones especulativas).
 */
export function usePrefetchIntent(song: Song) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useMemo(() => {
    const clear = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
    return {
      onPointerEnter: (e: React.PointerEvent) => {
        if (e.pointerType !== 'mouse' || !getCustomBackendUrl()) return;
        clear();
        timer.current = setTimeout(() => prefetchSong(song), 250);
      },
      onPointerLeave: clear,
      onPointerDown: () => {
        if (getCustomBackendUrl()) prefetchSong(song);
      },
    };
  }, [song]);
}
