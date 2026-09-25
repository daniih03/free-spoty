import { useEffect } from 'react';
import { requestAppUpdate } from '../state/player';
import { uiStore } from '../state/ui';

const CHECK_INTERVAL_MS = 60_000;

/**
 * Detecta nuevos despliegues comparando `version.json` con la versión con la
 * que se compiló este bundle (`__APP_VERSION__`, inyectada por Vite).
 * La recarga se aplica sin cortar la música: se espera a que no haya nada
 * sonando y la sesión (canción, cola y posición) se restaura tras recargar.
 */
export function useVersionCheck() {
  useEffect(() => {
    if (import.meta.env.DEV) return;
    let stopped = false;

    const check = async () => {
      try {
        const res = await fetch(`./version.json?_t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const { version } = await res.json();
        if (!stopped && version && version !== __APP_VERSION__) {
          stopped = true;
          uiStore.set({ updateAvailable: true });
          requestAppUpdate();
        }
      } catch {
        /* sin red: se reintenta en el siguiente ciclo */
      }
    };

    check();
    const timer = setInterval(check, CHECK_INTERVAL_MS);
    const onVisible = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
}
