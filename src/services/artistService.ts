import { Song, Album, ArtistProfile } from '../types/music';

const artistCache = new Map<string, ArtistProfile>();
const albumTracksCache = new Map<string, Song[]>();

/**
 * Format raw artist picture from Deezer or fallback to iTunes
 */
async function getArtistPictureAndFans(artistName: string, fallbackUrl: string): Promise<{ pictureUrl: string; listeners: number }> {
  try {
    const res = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(artistName)}`, {
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const data = await res.json();
      const match = data.data?.[0];
      if (match) {
        return {
          pictureUrl: match.picture_xl || match.picture_big || match.picture_medium || fallbackUrl,
          listeners: match.nb_fan || 0,
        };
      }
    }
  } catch {}

  return {
    pictureUrl: fallbackUrl,
    listeners: 0,
  };
}

/**
 * Fetch full artist profile, top tracks, and complete discography (albums & singles)
 */
export async function getArtistProfile(artistName: string): Promise<ArtistProfile | null> {
  const cleanName = artistName.trim();
  const cacheKey = cleanName.toLowerCase();

  if (artistCache.has(cacheKey)) {
    return artistCache.get(cacheKey)!;
  }

  try {
    // 1. Find iTunes artist ID
    const searchRes = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(cleanName)}&entity=musicArtist&limit=1`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!searchRes.ok) throw new Error('Artist not found in iTunes');

    const searchData = await searchRes.json();
    const artist = searchData.results?.[0];
    if (!artist || !artist.artistId) {
      return null;
    }

    const artistId = artist.artistId;
    const genre = artist.primaryGenreName || 'Música';

    // 2. Concurrently fetch top songs and albums
    const [songsRes, albumsRes] = await Promise.all([
      fetch(`https://itunes.apple.com/lookup?id=${artistId}&entity=song&limit=25`, {
        signal: AbortSignal.timeout(4000),
      }),
      fetch(`https://itunes.apple.com/lookup?id=${artistId}&entity=album&limit=60`, {
        signal: AbortSignal.timeout(4000),
      }),
    ]);

    const songsData = songsRes.ok ? await songsRes.json() : { results: [] };
    const albumsData = albumsRes.ok ? await albumsRes.json() : { results: [] };

    // 3. Map top songs
    const topSongs: Song[] = (songsData.results || [])
      .filter((item: any) => item.wrapperType === 'track')
      .map((item: any) => {
        const artwork = item.artworkUrl100
          ? item.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg')
          : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

        return {
          id: `itunes_${item.trackId}`,
          title: item.trackName,
          artist: item.artistName || cleanName,
          album: item.collectionName,
          duration: Math.round(item.trackTimeMillis / 1000),
          coverUrl: artwork,
          youtubeId: '',
          currentVersion: 'radio' as const,
          availableVersions: {},
          hasSyncedLyrics: true,
        };
      });

    // 4. Map albums
    const rawAlbums = (albumsData.results || []).filter((item: any) => item.wrapperType === 'collection');
    const seenAlbums = new Set<string>();
    const albums: Album[] = [];

    for (const item of rawAlbums) {
      const title = item.collectionName;
      if (!title || seenAlbums.has(title.toLowerCase())) continue;
      seenAlbums.add(title.toLowerCase());

      const artwork = item.artworkUrl100
        ? item.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg')
        : topSongs[0]?.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

      const year = item.releaseDate ? item.releaseDate.substring(0, 4) : '';
      const trackCount = item.trackCount || 1;
      let type: 'album' | 'single' | 'ep' = 'album';

      if (trackCount <= 2 || title.toLowerCase().includes('single')) {
        type = 'single';
      } else if (trackCount <= 6 || title.toLowerCase().includes('ep')) {
        type = 'ep';
      }

      albums.push({
        id: String(item.collectionId),
        title,
        artist: item.artistName || cleanName,
        coverUrl: artwork,
        releaseYear: year,
        trackCount,
        genre: item.primaryGenreName,
        type,
      });
    }

    // 5. Get high-res artist portrait and listeners count
    const defaultArtwork = topSongs[0]?.coverUrl || albums[0]?.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
    const { pictureUrl, listeners } = await getArtistPictureAndFans(cleanName, defaultArtwork);

    const profile: ArtistProfile = {
      id: String(artistId),
      name: artist.artistName || cleanName,
      pictureUrl,
      genre,
      listeners,
      topSongs,
      albums,
    };

    artistCache.set(cacheKey, profile);
    return profile;
  } catch (err) {
    console.warn('Error fetching artist profile:', err);
    return null;
  }
}

/**
 * Fetch all track songs from a specific album
 */
export async function getAlbumTracks(albumId: string, artistName: string): Promise<Song[]> {
  if (albumTracksCache.has(albumId)) {
    return albumTracksCache.get(albumId)!;
  }

  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${albumId}&entity=song`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];

    const data = await res.json();
    const tracks: Song[] = (data.results || [])
      .filter((item: any) => item.wrapperType === 'track')
      .map((item: any) => {
        const artwork = item.artworkUrl100
          ? item.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg')
          : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

        return {
          id: `itunes_${item.trackId}`,
          title: item.trackName,
          artist: item.artistName || artistName,
          album: item.collectionName,
          duration: Math.round(item.trackTimeMillis / 1000),
          coverUrl: artwork,
          youtubeId: '',
          currentVersion: 'radio' as const,
          availableVersions: {},
          hasSyncedLyrics: true,
        };
      });

    albumTracksCache.set(albumId, tracks);
    return tracks;
  } catch (err) {
    console.warn('Error fetching album tracks:', err);
    return [];
  }
}
