import { activeBackend } from './serverStatus';
import { fetchJson } from '../lib/net';

/**
 * Importación de playlists de Spotify a partir de su link público.
 *
 * Se pide primero al servidor propio (`GET /api/spotify-playlist`, sin
 * problema de CORS), que intenta en orden: Web API con Client Credentials
 * (si hay `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET` configuradas, aunque
 * Spotify exige Premium en la cuenta dueña de la app), Web API con el token
 * anónimo del propio widget (gratis, sin cuenta), y por último el widget
 * embebible (`open.spotify.com/embed/playlist/<id>`, JSON `__NEXT_DATA__`),
 * que recorta a ~100 pistas. Si el servidor propio no está activo, se usa
 * como último respaldo el lector de Jina AI (`r.jina.ai`, refleja el origen
 * en `Access-Control-Allow-Origin`) sobre el widget, porque esa página no
 * envía cabeceras CORS.
 */

export interface SpotifyImportTrack {
  title: string;
  artist: string;
  duration: number; // segundos
}

export interface SpotifyImportResult {
  name: string;
  coverUrl: string;
  tracks: SpotifyImportTrack[];
}

const SPOTIFY_PLAYLIST_RE = /open\.spotify\.com\/(?:intl-\w+\/)?playlist\/([A-Za-z0-9]{22})|spotify:playlist:([A-Za-z0-9]{22})/;

/** Extrae el ID de playlist de un link o URI de Spotify, o `null` si no hay ninguno. */
export function extractSpotifyPlaylistId(text: string): string | null {
  const match = text.match(SPOTIFY_PLAYLIST_RE);
  return match ? match[1] || match[2] || null : null;
}

function parseEmbedHtml(html: string): SpotifyImportResult {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('No se encontraron datos de la playlist');
  const data = JSON.parse(match[1]);
  const entity = data?.props?.pageProps?.state?.data?.entity;
  if (!entity || entity.type !== 'playlist') {
    throw new Error('El enlace no es una playlist pública de Spotify');
  }
  return {
    name: entity.name || 'Playlist importada',
    coverUrl: entity.coverArt?.sources?.[0]?.url || '',
    tracks: (entity.trackList || [])
      .filter((t: any) => t && t.entityType === 'track')
      .map((t: any) => ({
        title: t.title,
        artist: t.subtitle,
        duration: Math.round((t.duration || 0) / 1000),
      })),
  };
}

async function fetchViaCorsProxy(playlistId: string): Promise<SpotifyImportResult> {
  const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
  const res = await fetch(`https://r.jina.ai/${embedUrl}`, {
    headers: { 'X-Return-Format': 'html' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseEmbedHtml(await res.text());
}

/** Lee nombre, carátula y pistas de una playlist pública a partir de su ID. */
export async function fetchSpotifyPlaylist(playlistId: string): Promise<SpotifyImportResult> {
  const backend = activeBackend();
  if (backend) {
    try {
      return await fetchJson<SpotifyImportResult>(`${backend}/api/spotify-playlist?id=${playlistId}`, {
        timeoutMs: 10000,
      });
    } catch {
      /* sin servidor propio disponible: se prueba con el proxy público */
    }
  }
  return fetchViaCorsProxy(playlistId);
}
