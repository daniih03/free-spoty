import { Song, VersionType, SongVersions } from '../types/music';
import { FEATURED_PLAYLISTS } from './exploreData';
import { getCustomBackendUrl } from './youtube';

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

// Verified high-availability Piped API instances with open CORS and zero rate limits
let activePipedInstances: string[] = [
  'https://api.piped.private.coffee',
  'https://pipedapi.ducks.party',
];

// Verified Invidious instances for secondary fallback
let activeInvidiousInstances: string[] = [
  'yewtu.be',
  'invidious.nerdvpn.de',
];

// Helper to fetch candidates from a single Piped instance with strict timeout
async function fetchCandidatesFromPiped(endpoint: string, query: string, timeoutMs = 3500): Promise<string[]> {
  const url = `${endpoint}/search?q=${encodeURIComponent(query)}&filter=videos`;
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`Piped ${endpoint} returned status ${res.status}`);
  const data = await res.json();
  const candidates: string[] = [];
  if (Array.isArray(data.items)) {
    for (const item of data.items) {
      if (item?.url && item.url.includes('/watch?v=')) {
        const id = item.url.replace('/watch?v=', '').split('&')[0];
        if (id && !candidates.includes(id)) {
          candidates.push(id);
        }
      }
    }
  }
  if (candidates.length === 0) throw new Error(`No video items on ${endpoint}`);
  return candidates;
}

// Resilient first-success promise race helper
async function raceFirstSuccessful<T>(promises: Promise<T>[]): Promise<T> {
  if (typeof Promise.any === 'function') {
    return Promise.any(promises);
  }
  return new Promise<T>((resolve, reject) => {
    const errors: any[] = [];
    let rejectedCount = 0;
    if (promises.length === 0) return reject(new Error('No promises provided'));
    promises.forEach((p) => {
      p.then(resolve).catch((err) => {
        errors.push(err);
        rejectedCount++;
        if (rejectedCount === promises.length) {
          reject(new Error('All candidate instances failed'));
        }
      });
    });
  });
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
 * Fast search to find multiple YouTube video candidates for playback robustness.
 */
export async function searchYoutubeVideoCandidates(query: string): Promise<string[]> {
  const candidates: string[] = [];

  // 1. If backend URL is set, try backend search endpoint first
  const backendUrl = getCustomBackendUrl();
  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/api/search?q=${encodeURIComponent(query)}`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results)) {
          for (const item of data.results) {
            if (item?.videoId && !candidates.includes(item.videoId)) {
              candidates.push(item.videoId);
            }
          }
          if (candidates.length > 0) return candidates;
        }
      }
    } catch {}
  }

  // 2. YouTube API Key (if user configured)
  const apiKey = getCustomApiKey();
  if (apiKey) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        for (const item of (data.items || [])) {
          const id = item?.id?.videoId;
          if (id && !candidates.includes(id)) candidates.push(id);
        }
        if (candidates.length > 0) return candidates;
      }
    } catch (e) {
      console.warn('YouTube API query failed:', e);
    }
  }

  // 3. Primary Engine: Race active high-availability Piped instances in parallel
  try {
    const pipedResults = await raceFirstSuccessful(
      activePipedInstances.map((ep) => fetchCandidatesFromPiped(ep, query, 3500))
    );
    if (pipedResults && pipedResults.length > 0) {
      return pipedResults;
    }
  } catch {
    // Proceed to fallback
  }

  // 4. Secondary Fallback: Query Invidious instances
  for (const domain of activeInvidiousInstances) {
    try {
      const url = `https://${domain}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          for (const item of data.slice(0, 5)) {
            if (item?.videoId && !candidates.includes(item.videoId)) {
              candidates.push(item.videoId);
            }
          }
          if (candidates.length > 0) return candidates;
        }
      }
    } catch {
      // Continue to next instance
    }
  }

  return candidates;
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

  // Clean title: remove any parentheses and brackets like (Remix), [feat. ...], (Remastered)
  const cleanTitle = song.title
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/feat\..*$/i, '')
    .trim();
  const cleanArtist = song.artist.trim();

  // 1. Primary: Studio Audio Track (Clean, instant 0:00 start, ad-free on mobile)
  let candidates = await searchYoutubeVideoCandidates(`${cleanArtist} ${cleanTitle} audio`);

  // 2. High-precision fallback: direct artist & title
  if (candidates.length === 0) {
    candidates = await searchYoutubeVideoCandidates(`${cleanArtist} ${cleanTitle}`);
  }

  const primaryId = candidates[0] || '';
  const versions: SongVersions = {
    radio: primaryId || undefined,
    lyrics: candidates[1] || primaryId || undefined,
    original: candidates[2] || primaryId || undefined,
  };

  const updatedSong: Song = {
    ...song,
    youtubeId: primaryId,
    candidateVideoIds: candidates,
    currentVersion: 'radio',
    availableVersions: versions,
  };

  if (primaryId) {
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

    const candidates = await searchYoutubeVideoCandidates(query);
    targetId = candidates[0] || song.youtubeId;
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
