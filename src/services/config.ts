/**
 * Configuración de usuario opcional: servidor de audio propio y API Key de YouTube.
 */

const BACKEND_URL_KEY = 'free_spoty_backend_url';
const YT_API_KEY = 'free_spoty_yt_api_key';

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
