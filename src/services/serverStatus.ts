import { getCustomBackendUrl, isOfflineFallbackEnabled } from './config';

/**
 * Disponibilidad del servidor de audio propio.
 *
 * - Servidor respondiendo → se usa siempre (0 anuncios).
 * - Servidor caído (PC apagado) y respaldo activado → se usa YouTube hasta que
 *   vuelva; se re-comprueba en segundo plano cada 30 s como máximo.
 */

type State = 'unknown' | 'up' | 'down';

let state: State = 'unknown';
let checkedUrl = '';
let lastCheck = 0;
let inflight: Promise<boolean> | null = null;
const RECHECK_MS = 30_000;
const listeners = new Set<(up: boolean) => void>();

/** Notifica los cambios caído/disponible (el motor precarga YouTube si cae). */
export function onServerStateChange(fn: (up: boolean) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function setState(next: State) {
  const changed = next !== state;
  state = next;
  lastCheck = Date.now();
  if (changed && next !== 'unknown') listeners.forEach((fn) => fn(next === 'up'));
}

export function checkServer(): Promise<boolean> {
  const url = getCustomBackendUrl();
  if (!url) return Promise.resolve(false);
  if (inflight && checkedUrl === url) return inflight;
  checkedUrl = url;
  inflight = fetch(`${url}/health`, { signal: AbortSignal.timeout(3000) })
    .then((r) => r.ok)
    .catch(() => false)
    .then((ok) => {
      setState(ok ? 'up' : 'down');
      inflight = null;
      return ok;
    });
  return inflight;
}

export function markServerDown() {
  setState('down');
}

/**
 * URL del servidor a usar ahora mismo, o '' para usar YouTube.
 * Sin respaldo activado se devuelve siempre la URL (modo estricto total).
 */
export function activeBackend(): string {
  const url = getCustomBackendUrl();
  if (!url) return '';
  if (url !== checkedUrl) {
    state = 'unknown';
    void checkServer();
  }
  if (state !== 'down' || !isOfflineFallbackEnabled()) return url;
  if (Date.now() - lastCheck > RECHECK_MS) void checkServer();
  return '';
}

// Comprobación inicial y al volver a la app (p. ej. tras encender el PC)
if (typeof window !== 'undefined') {
  void checkServer();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state === 'down') void checkServer();
  });
}
