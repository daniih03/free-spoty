export function formatTime(secs: number): string {
  if (!Number.isFinite(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return 'Buenos días';
  if (hour >= 12 && hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Clave canónica título+artista para cachés y deduplicación. */
export function songKey(title: string, artist: string): string {
  return `${title.trim().toLowerCase()}-${artist.trim().toLowerCase()}`;
}

/** Elimina (Remix), [feat. X], "feat. X"… para búsquedas más precisas. */
export function cleanTitle(title: string): string {
  return title
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\s(feat|ft)\..*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}
