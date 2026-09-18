import { Song, VersionType, SongVersions } from '../types/music';
import { FEATURED_PLAYLISTS } from './exploreData';

// User optional YouTube API Key saved in localStorage
const YT_API_KEY_STORAGE = 'free_spoty_yt_api_key';

export function getCustomApiKey(): string {
  return localStorage.getItem(YT_API_KEY_STORAGE) || '';
}

export function setCustomApiKey(key: string) {
  if (key) {
    localStorage.setItem(YT_API_KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(YT_API_KEY_STORAGE);
  }
}

// In-memory cache for resolved songs to ensure instant playback
const songCache = new Map<string, Song>();

// Pre-fill cache with featured songs
FEATURED_PLAYLISTS.forEach(playlist => {
  playlist.songs.forEach(song => {
    songCache.set(song.id, song);
    songCache.set(`${song.title.toLowerCase()}-${song.artist.toLowerCase()}`, song);
  });
});

// Verified Invidious instances with search API support
let activeInvidiousInstances: string[] = [
  'invidious.f5.si',
  'inv.nadeko.net',
  'invidious.nerdvpn.de',
  'invidious.projectsegfau.lt',
  'iv.melmac.space',
];

// Dynamically refresh healthy CORS instances in background
export async function refreshInvidiousInstances() {
  try {
    const res = await fetch('https://api.invidious.io/instances.json', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const list = await res.json();
      const healthy = list
        .filter((item: any) => item[1]?.type === 'https' && item[1]?.api === true && item[1]?.cors === true)
        .map((item: any) => item[0]);
      if (healthy.length > 0) {
        activeInvidiousInstances = [...new Set([...healthy, ...activeInvidiousInstances])];
      }
    }
  } catch {
    // Keep fallback list
  }
}

// Trigger initial instance refresh
if (typeof window !== 'undefined') {
  refreshInvidiousInstances();
}

/**
 * Searches songs using the iTunes Search API (fast, rich metadata, 600x600 artwork, CORS-free).
 */
export async function searchSongsMetadata(query: string, signal?: AbortSignal): Promise<Song[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Check if query matches any featured songs first
  const localMatches = FEATURED_PLAYLISTS.flatMap(p => p.songs).filter(s =>
    s.title.toLowerCase().includes(trimmed.toLowerCase()) ||
    s.artist.toLowerCase().includes(trimmed.toLowerCase())
  );

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(trimmed)}&entity=song&limit=25`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error('iTunes search failed');

    const data = await res.json();
    const itunesSongs: Song[] = (data.results || []).map((item: any) => {
      // Upscale artwork from 100x100 to 600x600 for sharp display
      const artwork = item.artworkUrl100
        ? item.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg')
        : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

      const songId = `itunes_${item.trackId}`;
      const cacheKey = `${item.trackName.toLowerCase()}-${item.artistName.toLowerCase()}`;
      const cached = songCache.get(cacheKey);

      if (cached) {
        return {
          ...cached,
          coverUrl: artwork || cached.coverUrl,
        };
      }

      const song: Song = {
        id: songId,
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName,
        duration: Math.round(item.trackTimeMillis / 1000),
        coverUrl: artwork,
        youtubeId: '', // Resolved instantly on first play
        currentVersion: 'radio',
        availableVersions: {},
        hasSyncedLyrics: true,
      };

      return song;
    });

    // Merge without duplicates
    const combined = [...localMatches];
    const seen = new Set(combined.map(s => `${s.title.toLowerCase()}-${s.artist.toLowerCase()}`));

    for (const s of itunesSongs) {
      const key = `${s.title.toLowerCase()}-${s.artist.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(s);
      }
    }

    return combined;
  } catch (err: any) {
    if (err.name === 'AbortError') return [];
    console.warn('Metadata search fallback to local:', err);
    return localMatches;
  }
}

/**
 * Single fast query to find a YouTube video ID.
 */
async function searchYoutubeVideoId(query: string): Promise<string | null> {
  const apiKey = getCustomApiKey();

  // 1. If user provided a YouTube API key
  if (apiKey) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const id = data.items?.[0]?.id?.videoId;
        if (id) return id;
      }
    } catch (e) {
      console.warn('YouTube API query failed:', e);
    }
  }

  // 2. Query active Invidious instances
  for (const domain of activeInvidiousInstances) {
    try {
      const url = `https://${domain}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2800);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0]?.videoId) {
          return data[0].videoId;
        }
      }
    } catch {
      // Continue to next instance
    }
  }

  return null;
}

/**
 * Resolves the primary audio track from YouTube Music (Topic / Master Audio)
 * and starts playback in milliseconds with zero delay.
 */
export async function resolveSongWithVersions(song: Song): Promise<Song> {
  const cacheKey = `${song.title.toLowerCase()}-${song.artist.toLowerCase()}`;
  const existing = songCache.get(cacheKey) || songCache.get(song.id);

  if (existing && existing.youtubeId) {
    return existing;
  }

  // Clean title: remove any parentheses and brackets like (Directo Price), [feat. ...], (Remastered)
  const cleanTitle = song.title
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/feat\..*$/i, '')
    .trim();
  const cleanArtist = song.artist.trim();

  // 1. Primary: Lyric Video (clean studio audio, user uploads have fewer/zero video ads)
  const lyricQuery = `${cleanArtist} ${cleanTitle} lyric video`;
  let videoId = await searchYoutubeVideoId(lyricQuery);

  // 2. Fallback: Audio / Radio Studio Track
  if (!videoId) {
    const audioQuery = `${cleanArtist} ${cleanTitle} audio`;
    videoId = await searchYoutubeVideoId(audioQuery);
  }

  // 3. Fallback: YouTube Music Topic
  if (!videoId) {
    const topicQuery = `${cleanArtist} ${cleanTitle} Topic`;
    videoId = await searchYoutubeVideoId(topicQuery);
  }

  // 4. Fallback: Direct
  if (!videoId) {
    const directQuery = `${cleanArtist} ${cleanTitle}`;
    videoId = await searchYoutubeVideoId(directQuery);
  }

  const versions: SongVersions = {
    radio: videoId || undefined,
    lyrics: videoId || undefined,
  };

  const updatedSong: Song = {
    ...song,
    youtubeId: videoId || '',
    currentVersion: 'radio',
    availableVersions: versions,
  };

  if (videoId) {
    songCache.set(song.id, updatedSong);
    songCache.set(cacheKey, updatedSong);
  }

  return updatedSong;
}

/**
 * Switch a song to a specific version on demand (e.g. 'radio', 'lyrics', 'original')
 */
export async function switchSongVersion(song: Song, targetVersion: VersionType): Promise<Song> {
  let targetId = song.availableVersions?.[targetVersion];

  if (!targetId) {
    const cleanTitle = song.title.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
    const cleanArtist = song.artist.trim();

    let query = '';
    if (targetVersion === 'radio') query = `${cleanArtist} ${cleanTitle} audio`;
    else if (targetVersion === 'lyrics') query = `${cleanArtist} ${cleanTitle} lyrics`;
    else query = `${cleanArtist} ${cleanTitle} video oficial`;

    targetId = (await searchYoutubeVideoId(query)) || song.youtubeId;
  }

  const updated: Song = {
    ...song,
    youtubeId: targetId,
    currentVersion: targetVersion,
    availableVersions: {
      ...song.availableVersions,
      [targetVersion]: targetId,
    },
  };

  if (targetId) {
    songCache.set(song.id, updated);
  }
  return updated;
}
