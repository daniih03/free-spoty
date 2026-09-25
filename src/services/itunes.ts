import type { Song } from '../types/music';
import { DEFAULT_PLAYLIST_COVER } from '../lib/images';

/** Sube la carátula de iTunes de 100x100 a 600x600 (se reescala luego con `artwork()`). */
export function itunesArtwork(url100?: string): string {
  return url100 ? url100.replace(/\/\d+x\d+bb\.(jpg|png)$/, '/600x600bb.$1') : DEFAULT_PLAYLIST_COVER;
}

export function itunesTrackToSong(item: any, fallbackArtist = ''): Song {
  return {
    id: `itunes_${item.trackId}`,
    title: item.trackName,
    artist: item.artistName || fallbackArtist,
    album: item.collectionName,
    duration: Math.round((item.trackTimeMillis || 0) / 1000),
    coverUrl: itunesArtwork(item.artworkUrl100),
    youtubeId: '',
  };
}
