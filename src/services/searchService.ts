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

// In-memory cache for resolved songs to ensure instant switching
const songCache = new Map<string, Song>();

// Pre-fill cache with featured songs
FEATURED_PLAYLISTS.forEach(playlist => {
  playlist.songs.forEach(song => {
    songCache.set(song.id, song);
    songCache.set(`${song.title.toLowerCase()}-${song.artist.toLowerCase()}`, song);
  });
});

// Verified CORS-enabled Invidious instances
let activeInvidiousInstances: string[] = [
  'invidious.f5.si',
];

// Dynamically refresh healthy CORS instances in background
export async function refreshInvidiousInstances() {
  try {
    const res = await fetch('https://api.invidious.io/instances.json', { signal: AbortSignal.timeout(4000) });
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

// Trigger initial refresh
if (typeof window !== 'undefined') {
  refreshInvidiousInstances();
}

/**
 * Searches songs using the iTunes Search API (fast, rich metadata, 600x600 artwork, CORS-free).
 */
export async function searchSongsMetadata(query: string): Promise<Song[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Check if query matches any featured songs first
  const localMatches = FEATURED_PLAYLISTS.flatMap(p => p.songs).filter(s =>
    s.title.toLowerCase().includes(trimmed.toLowerCase()) ||
    s.artist.toLowerCase().includes(trimmed.toLowerCase())
  );

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(trimmed)}&entity=song&limit=25`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('iTunes search failed');

    const data = await res.json();
    const itunesSongs: Song[] = (data.results || []).map((item: any) => {
      // Upscale artwork from 100x100 to 600x600 for sharp modern display
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
        youtubeId: '', // Resolved dynamically when played
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
  } catch (err) {
    console.warn('Metadata search fallback to local:', err);
    return localMatches;
  }
}

/**
 * Searches for a YouTube video ID for a specific query string.
 * Uses official API if key provided, then active Invidious instances.
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
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0]?.videoId) {
          return data[0].videoId;
        }
      }
    } catch {
      // Try next instance in pool
    }
  }

  return null;
}

/**
 * Resolves all versions for a song adhering strictly to the user requirement:
 * 1. Radio Version / Radio Edit (clean, without film intros or silences)
 * 2. Lyrics Version / Lyric Video
 * 3. Original / Official Audio
 */
export async function resolveSongWithVersions(song: Song): Promise<Song> {
  const cacheKey = `${song.title.toLowerCase()}-${song.artist.toLowerCase()}`;
  const existing = songCache.get(cacheKey) || songCache.get(song.id);

  // If already fully resolved with a valid video ID, return it
  if (existing && existing.youtubeId && existing.availableVersions && Object.keys(existing.availableVersions).length > 0) {
    return existing;
  }

  const versions: SongVersions = { ...song.availableVersions };

  // Clean strings (remove extraneous brackets or remastered text)
  const cleanTitle = song.title
    .replace(/\(.*?(remaster|version|edition).*?\)/gi, '')
    .replace(/\[.*?(remaster|version|edition).*?\]/gi, '')
    .trim();
  const cleanArtist = song.artist.trim();

  // Specific query variants for each priority
  const radioQuery = `${cleanArtist} ${cleanTitle} radio edit`;
  const lyricsQuery = `${cleanArtist} ${cleanTitle} lyrics`;
  const originalQuery = `${cleanArtist} ${cleanTitle} audio`;
  const directQuery = `${cleanArtist} ${cleanTitle}`;

  // Execute in parallel for optimal speed
  const [radioId, lyricsId, originalId] = await Promise.all([
    versions.radio ? Promise.resolve(versions.radio) : searchYoutubeVideoId(radioQuery),
    versions.lyrics ? Promise.resolve(versions.lyrics) : searchYoutubeVideoId(lyricsQuery),
    versions.original ? Promise.resolve(versions.original) : searchYoutubeVideoId(originalQuery),
  ]);

  if (radioId) versions.radio = radioId;
  if (lyricsId) versions.lyrics = lyricsId;
  if (originalId) versions.original = originalId;

  // If none of the 3 returned an ID, run a direct query as fallback
  if (!versions.radio && !versions.lyrics && !versions.original) {
    const directId = await searchYoutubeVideoId(directQuery);
    if (directId) {
      versions.original = directId;
    }
  }

  // Determine active version according to user's requested priority:
  // 1: Radio Version -> 2: Lyrics Version -> 3: Original
  let chosenVersion: VersionType = 'radio';
  let chosenId = versions.radio;

  if (!chosenId && versions.lyrics) {
    chosenVersion = 'lyrics';
    chosenId = versions.lyrics;
  }

  if (!chosenId && versions.original) {
    chosenVersion = 'original';
    chosenId = versions.original;
  }

  // If still nothing, preserve previous youtubeId if it was valid
  if (!chosenId && song.youtubeId) {
    chosenId = song.youtubeId;
  }

  const updatedSong: Song = {
    ...song,
    youtubeId: chosenId || '',
    currentVersion: chosenVersion,
    availableVersions: versions,
  };

  if (chosenId) {
    songCache.set(song.id, updatedSong);
    songCache.set(cacheKey, updatedSong);
  }

  return updatedSong;
}

/**
 * Switch a song to a specific version (e.g. 'radio', 'lyrics', 'original')
 */
export async function switchSongVersion(song: Song, targetVersion: VersionType): Promise<Song> {
  let targetId = song.availableVersions?.[targetVersion];

  if (!targetId) {
    let query = '';
    if (targetVersion === 'radio') query = `${song.artist} ${song.title} radio edit`;
    else if (targetVersion === 'lyrics') query = `${song.artist} ${song.title} lyrics`;
    else query = `${song.artist} ${song.title} audio`;

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
