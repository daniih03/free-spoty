import type { LyricsResult, SyncedLyricLine } from '../types/music';
import { fetchJson, TtlCache, dedupe } from '../lib/net';
import { cleanTitle, songKey } from '../lib/format';

const lyricsCache = new TtlCache<LyricsResult | null>(60 * 60_000, 100);
const TIME_TAG = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

/** Parsea formato LRC ("[mm:ss.xx] texto") a líneas ordenadas. */
export function parseLrcLyrics(lrc: string): SyncedLyricLine[] {
  const result: SyncedLyricLine[] = [];
  for (const raw of lrc.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const times: number[] = [];
    TIME_TAG.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = TIME_TAG.exec(line)) !== null) {
      const ms = m[3] ? parseInt(m[3].padEnd(3, '0').slice(0, 3), 10) : 0;
      times.push(parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + ms / 1000);
    }
    if (times.length === 0) continue; // metadatos [ar:], [ti:]…
    const text = line.replace(TIME_TAG, '').trim();
    for (const time of times) result.push({ time, text });
  }
  return result.sort((a, b) => a.time - b.time);
}

function fromRecord(rec: any): LyricsResult | null {
  if (rec?.syncedLyrics) {
    const lines = parseLrcLyrics(rec.syncedLyrics);
    if (lines.length) return { synced: true, lines };
  }
  if (rec?.plainLyrics) {
    // Sin marcas de tiempo: se muestra como texto estático (no se inventa la sincronía)
    const lines = String(rec.plainLyrics)
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => ({ time: -1, text }));
    if (lines.length) return { synced: false, lines };
  }
  if (rec?.instrumental) return { synced: false, lines: [] };
  return null;
}

/**
 * Índice de la línea activa por búsqueda binaria (O(log n) en cada tick).
 */
export function findActiveLine(lines: SyncedLyricLine[], time: number): number {
  let lo = 0;
  let hi = lines.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].time <= time) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

/**
 * Letras desde LRCLIB (gratis, sin API key). Endpoint exacto con duración
 * primero; búsqueda difusa como respaldo, prefiriendo resultados sincronizados
 * con duración cercana.
 */
export const fetchLyrics = dedupe(
  (title: string, artist: string, _duration?: number) => songKey(title, artist),
  async (title: string, artist: string, duration?: number): Promise<LyricsResult | null> => {
    const key = songKey(title, artist);
    const cached = lyricsCache.get(key);
    if (cached !== undefined) return cached;

    const track = cleanTitle(title);
    let result: LyricsResult | null = null;

    try {
      let url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(track)}`;
      if (duration) url += `&duration=${Math.round(duration)}`;
      result = fromRecord(await fetchJson(url, { timeoutMs: 5000 }));
    } catch {
      /* 404 o timeout → búsqueda */
    }

    if (!result || !result.synced) {
      try {
        const list = await fetchJson<any[]>(
          `https://lrclib.net/api/search?q=${encodeURIComponent(`${track} ${artist}`)}`,
          { timeoutMs: 5000 }
        );
        if (Array.isArray(list) && list.length) {
          const close = (r: any) => !duration || !r.duration || Math.abs(r.duration - duration) <= 5;
          const best =
            list.find((r) => r.syncedLyrics && close(r)) ||
            list.find((r) => r.syncedLyrics) ||
            list.find((r) => r.plainLyrics);
          result = fromRecord(best) || result;
        }
      } catch (err) {
        console.warn('No se pudieron cargar las letras:', err);
      }
    }

    lyricsCache.set(key, result);
    return result;
  }
);
