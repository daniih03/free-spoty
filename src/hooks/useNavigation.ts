import { useCallback, useEffect, useRef, useState } from 'react';

export type ViewType = 'home' | 'search' | 'library' | 'liked' | 'history' | 'playlist' | 'artist';

export interface Route {
  view: ViewType;
  /** ID de playlist o nombre de artista. */
  id?: string;
}

const VIEWS: ViewType[] = ['home', 'search', 'library', 'liked', 'history', 'playlist', 'artist'];

/**
 * Rutas por hash (#/artist/Dua%20Lipa): compatibles con GitHub Pages (sin 404
 * al refrescar), enlazables y conectadas al historial del navegador, de modo
 * que el botón "atrás" de Android/iOS navega dentro de la app.
 */
function parseHash(hash: string): Route {
  const [rawView, ...rest] = hash.replace(/^#\/?/, '').split('/');
  const view = (VIEWS.includes(rawView as ViewType) ? rawView : 'home') as ViewType;
  const id = rest.length ? decodeURIComponent(rest.join('/')) : undefined;
  if ((view === 'playlist' || view === 'artist') && !id) return { view: 'home' };
  return { view, id };
}

function toHash(route: Route): string {
  if (route.view === 'home') return '#/';
  return route.id ? `#/${route.view}/${encodeURIComponent(route.id)}` : `#/${route.view}`;
}

interface HistoryMeta {
  idx: number;
}

export function useNavigation() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  const [idx, setIdx] = useState(() => (window.history.state as HistoryMeta | null)?.idx ?? 0);
  const [maxIdx, setMaxIdx] = useState(idx);
  const idxRef = useRef(idx);
  idxRef.current = idx;

  useEffect(() => {
    if (!(window.history.state as HistoryMeta | null)) {
      window.history.replaceState({ idx: 0 } satisfies HistoryMeta, '', toHash(route) + window.location.search);
    }
    // Atrás/adelante del navegador, o un hash editado a mano / enlace <a href="#/…">
    // (esos crean una entrada sin estado: se le asigna el siguiente índice).
    const sync = () => {
      const state = window.history.state as HistoryMeta | null;
      if (state) {
        setIdx(state.idx);
      } else {
        const nextIdx = idxRef.current + 1;
        window.history.replaceState({ idx: nextIdx } satisfies HistoryMeta, '');
        setIdx(nextIdx);
        setMaxIdx(nextIdx);
      }
      setRoute(parseHash(window.location.hash));
    };
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = useCallback(
    (view: ViewType, id?: string, { replace = false } = {}) => {
      const next: Route = { view, id };
      if (next.view === route.view && next.id === route.id) return;
      if (replace) {
        window.history.replaceState({ idx } satisfies HistoryMeta, '', toHash(next));
      } else {
        const nextIdx = idx + 1;
        window.history.pushState({ idx: nextIdx } satisfies HistoryMeta, '', toHash(next));
        setIdx(nextIdx);
        setMaxIdx(nextIdx);
      }
      setRoute(next);
    },
    [route, idx]
  );

  const goBack = useCallback(() => {
    if (idx > 0) window.history.back();
  }, [idx]);

  const goForward = useCallback(() => {
    if (idx < maxIdx) window.history.forward();
  }, [idx, maxIdx]);

  return {
    route,
    navigate,
    goBack,
    goForward,
    canGoBack: idx > 0,
    canGoForward: idx < maxIdx,
  };
}
