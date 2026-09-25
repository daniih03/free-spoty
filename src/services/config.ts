/**
 * Configuración de usuario opcional: servidor de audio propio y API Key de YouTube.
 */

const BACKEND_URL_KEY = 'free_spoty_backend_url';
const YT_API_KEY = 'free_spoty_yt_api_key';
const OFFLINE_FALLBACK_KEY = 'free_spoty_offline_fallback';

function read(key: string): string {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function write(key: string, value: string) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

export function getCustomBackendUrl(): string {
  const stored = read(BACKEND_URL_KEY) || import.meta.env.VITE_STREAM_API_URL || '';
  // Lección nº4: los servidores gratuitos de Render tienen cold starts de 30-45 s
  // que agotan el gesto del usuario en Safari/Chrome. Se purgan automáticamente.
  if (stored.includes('onrender.com')) {
    write(BACKEND_URL_KEY, '');
    return '';
  }
  return stored;
}

export function setCustomBackendUrl(url: string) {
  write(BACKEND_URL_KEY, url.trim().replace(/\/+$/, ''));
}

/**
 * Respaldo con YouTube cuando el servidor no responde (PC apagado). Activado
 * por defecto: la música nunca se para. Mientras el servidor responde se usa
 * siempre y nunca YouTube (0 anuncios); si un vídeo concreto falla en el
 * servidor se prueba otro vídeo, no YouTube.
 */
export function isOfflineFallbackEnabled(): boolean {
  return read(OFFLINE_FALLBACK_KEY) !== '0';
}

export function setOfflineFallback(enabled: boolean) {
  write(OFFLINE_FALLBACK_KEY, enabled ? '' : '0');
}

function isAcceptableServerUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    // Desde una web HTTPS solo se permite HTTPS, salvo localhost (contexto seguro)
    return url.protocol === 'https:' || (url.protocol === 'http:' && local);
  } catch {
    return false;
  }
}

/**
 * Conecta un servidor desde un enlace `…/free-spoty/?server=https://…`
 * (el que imprime server/start-windows.ps1, también como QR para el móvil).
 */
export function consumeServerLinkParam() {
  const params = new URLSearchParams(window.location.search);
  const server = params.get('server');
  if (!server) return;
  params.delete('server');
  const query = params.toString();
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);

  const clean = server.trim().replace(/\/+$/, '');
  if (clean === getCustomBackendUrl() || !isAcceptableServerUrl(clean)) return;
  if (window.confirm(`¿Conectar el servidor de audio sin anuncios?

${clean}`)) setCustomBackendUrl(clean);
}

export function getCustomApiKey(): string {
  return read(YT_API_KEY);
}

export function setCustomApiKey(key: string) {
  write(YT_API_KEY, key.trim());
}

export const EQ_PRESETS = [
  { id: 'flat', name: 'Plano (Default)', bass: 0, mid: 0, treble: 0 },
  { id: 'bass', name: 'Bass Boost 💥', bass: 8, mid: 2, treble: -2 },
  { id: 'vocal', name: 'Voz Clara 🎙️', bass: -3, mid: 6, treble: 3 },
  { id: 'electronic', name: 'Electrónica ⚡', bass: 6, mid: 0, treble: 5 },
  { id: 'acoustic', name: 'Acústico 🎸', bass: 3, mid: 4, treble: 4 },
];
