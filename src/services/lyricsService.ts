import { SyncedLyricLine } from '../types/music';

// Cache to avoid refetching lyrics for the same track
const lyricsCache = new Map<string, SyncedLyricLine[] | null>();

/**
 * Parses LRC format lyrics into an array of SyncedLyricLine objects.
 * Format: [mm:ss.xx] Lyric text
 */
export function parseLrcLyrics(lrcText: string): SyncedLyricLine[] {
  const lines = lrcText.split('\n');
  const result: SyncedLyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Reset regex index
    timeRegex.lastIndex = 0;
    let match: RegExpExecArray | null;
    const timestamps: number[] = [];

    while ((match = timeRegex.exec(trimmed)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3].padEnd(3, '0').slice(0, 3), 10);
      timestamps.push(minutes * 60 + seconds + milliseconds / 1000);
    }

    const text = trimmed.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
    if (text || timestamps.length > 0) {
      for (const time of timestamps) {
        result.push({ time, text });
      }
    }
  }

  // Sort chronologically
  return result.sort((a, b) => a.time - b.time);
}

/**
 * Fetches real-time synced lyrics from LRCLIB (open, free, no API key required).
 */
export async function fetchLyrics(trackTitle: string, artistName: string, duration?: number): Promise<SyncedLyricLine[] | null> {
  const cacheKey = `${trackTitle.toLowerCase()}-${artistName.toLowerCase()}`;
  if (lyricsCache.has(cacheKey)) {
    return lyricsCache.get(cacheKey)!;
  }

  // Clean track title (remove feat, radio edit, etc. for better lyrics match)
  const cleanTitle = trackTitle
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/feat\..*$/i, '')
    .trim();

  try {
    // 1. Try exact get endpoint
    let url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artistName)}&track_name=${encodeURIComponent(cleanTitle)}`;
    if (duration) {
      url += `&duration=${Math.round(duration)}`;
    }

    let res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.syncedLyrics) {
        const parsed = parseLrcLyrics(data.syncedLyrics);
        lyricsCache.set(cacheKey, parsed);
        return parsed;
      } else if (data.plainLyrics) {
        // Synthesize evenly spaced lines if only plain lyrics exist
        const plainLines: SyncedLyricLine[] = data.plainLyrics
          .split('\n')
          .filter((l: string) => l.trim())
          .map((text: string, idx: number) => ({
            time: idx * 4,
            text: text.trim(),
          }));
        lyricsCache.set(cacheKey, plainLines);
        return plainLines;
      }
    }

    // 2. Try search endpoint as fallback
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanTitle} ${artistName}`)}`;
    res = await fetch(searchUrl);
    if (res.ok) {
      const results = await res.json();
      if (Array.isArray(results) && results.length > 0) {
        const match = results.find((r: any) => r.syncedLyrics) || results[0];
        if (match.syncedLyrics) {
          const parsed = parseLrcLyrics(match.syncedLyrics);
          lyricsCache.set(cacheKey, parsed);
          return parsed;
        } else if (match.plainLyrics) {
          const plainLines: SyncedLyricLine[] = match.plainLyrics
            .split('\n')
            .filter((l: string) => l.trim())
            .map((text: string, idx: number) => ({
              time: idx * 4,
              text: text.trim(),
            }));
          lyricsCache.set(cacheKey, plainLines);
          return plainLines;
        }
      }
    }
  } catch (err) {
    console.warn('Could not load synced lyrics:', err);
  }

  lyricsCache.set(cacheKey, null);
  return null;
}
