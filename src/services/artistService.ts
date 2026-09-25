import type { Song, Album, ArtistProfile } from '../types/music';
import { fetchJson, fetchJsonp, TtlCache, dedupe } from '../lib/net';
import { songKey } from '../lib/format';
import { itunesArtwork, itunesTrackToSong } from './itunes';
import { DEFAULT_PLAYLIST_COVER } from '../lib/images';

const artistCache = new TtlCache<ArtistProfile | null>(30 * 60_000, 50);
const albumTracksCache = new TtlCache<Song[]>(30 * 60_000, 100);

/** Retrato en alta resolución (Deezer 1000x1000) y número de fans. */
async function getDeezerArtist(name: string): Promise<{ pictureUrl?: string; listeners: number }> {
  try {
    // La API de Deezer no envía CORS: se consulta por JSONP
    const data = await fetchJsonp(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=10`, {
      timeoutMs: 3000,
    });
    // Hay perfiles duplicados/fan-pages con el mismo nombre: se elige la
    // coincidencia exacta con más fans (el perfil oficial).
    const target = name.trim().toLowerCase();
    const candidates: any[] = data.data || [];
    const exact = candidates.filter((a) => String(a.name).trim().toLowerCase() === target);
    const match = (exact.length ? exact : candidates.slice(0, 1)).sort((a, b) => (b.nb_fan || 0) - (a.nb_fan || 0))[0];
    if (match && (exact.length || (match.nb_fan || 0) > 1000)) {
      return {
        pictureUrl: match.picture_xl || match.picture_big || match.picture_medium,
        listeners: match.nb_fan || 0,
      };
    }
  } catch {
    /* Deezer caído: se usa la carátula de iTunes */
  }
  return { listeners: 0 };
}

function classify(title: string, trackCount: number): Album['type'] {
  const t = title.toLowerCase();
  if (trackCount <= 2 || /\bsingle\b/.test(t)) return 'single';
  if (trackCount <= 6 || /\bep\b/.test(t)) return 'ep';
  return 'album';
}

/**
 * Perfil completo: top canciones + discografía (iTunes) + retrato/fans (Deezer).
 * Deezer se consulta en paralelo con iTunes (antes iba en serie al final).
 */
export const getArtistProfile = dedupe(
  (name: string) => name.trim().toLowerCase(),
  async (artistName: string): Promise<ArtistProfile | null> => {
    const name = artistName.trim();
    const key = name.toLowerCase();
    const cached = artistCache.get(key);
    if (cached !== undefined) return cached;

    const deezerPromise = getDeezerArtist(name);

    try {
      const search = await fetchJson(
        `https://itunes.apple.com/search?term=${encodeURIComponent(name)}&entity=musicArtist&limit=1`,
        { timeoutMs: 5000 }
      );
      const artist = search.results?.[0];
      if (!artist?.artistId) {
        artistCache.set(key, null);
        return null;
      }

      const [songsData, albumsData, deezer] = await Promise.all([
        fetchJson(`https://itunes.apple.com/lookup?id=${artist.artistId}&entity=song&limit=30`, {
          timeoutMs: 5000,
        }).catch(() => ({ results: [] })),
        fetchJson(`https://itunes.apple.com/lookup?id=${artist.artistId}&entity=album&limit=80`, {
          timeoutMs: 5000,
        }).catch(() => ({ results: [] })),
        deezerPromise,
      ]);

      const seenSongs = new Set<string>();
      const topSongs: Song[] = [];
      for (const item of songsData.results || []) {
        if (item.wrapperType !== 'track') continue;
        const song = itunesTrackToSong(item, name);
        const k = songKey(song.title, song.artist);
        if (seenSongs.has(k)) continue;
        seenSongs.add(k);
        topSongs.push(song);
      }

      const seenAlbums = new Set<string>();
      const albums: Album[] = [];
      for (const item of albumsData.results || []) {
        if (item.wrapperType !== 'collection' || !item.collectionName) continue;
        // "Nombre - Single" / "- EP": el tipo ya se muestra aparte
        const title: string = String(item.collectionName).replace(/\s+-\s+(Single|EP)$/i, '');
        if (seenAlbums.has(title.toLowerCase())) continue;
        seenAlbums.add(title.toLowerCase());
        const trackCount = item.trackCount || 1;
        albums.push({
          id: String(item.collectionId),
          title,
          artist: item.artistName || name,
          coverUrl: itunesArtwork(item.artworkUrl100),
          releaseYear: item.releaseDate ? item.releaseDate.substring(0, 4) : '',
          trackCount,
          genre: item.primaryGenreName,
          type: classify(title, trackCount),
        });
      }
      albums.sort((a, b) => b.releaseYear.localeCompare(a.releaseYear));

      const profile: ArtistProfile = {
        id: String(artist.artistId),
        name: artist.artistName || name,
        pictureUrl: deezer.pictureUrl || topSongs[0]?.coverUrl || albums[0]?.coverUrl || DEFAULT_PLAYLIST_COVER,
        genre: artist.primaryGenreName || 'Música',
        listeners: deezer.listeners,
        topSongs,
        albums,
      };

      artistCache.set(key, profile);
      return profile;
    } catch (err) {
      console.warn('Error al cargar el perfil del artista:', err);
      return null;
    }
  }
);

export async function getAlbumTracks(albumId: string, artistName: string): Promise<Song[]> {
  const cached = albumTracksCache.get(albumId);
  if (cached) return cached;
  try {
    const data = await fetchJson(`https://itunes.apple.com/lookup?id=${albumId}&entity=song`, { timeoutMs: 5000 });
    const tracks: Song[] = (data.results || [])
      .filter((item: any) => item.wrapperType === 'track')
      .map((item: any) => itunesTrackToSong(item, artistName));
    albumTracksCache.set(albumId, tracks);
    return tracks;
  } catch (err) {
    console.warn('Error al cargar las pistas del álbum:', err);
    return [];
  }
}
