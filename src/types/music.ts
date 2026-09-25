/** Variantes de vídeo conservadas por compatibilidad con los datos precargados. */
export type VersionType = 'radio' | 'lyrics' | 'original';

export interface SongVersions {
  radio?: string;
  lyrics?: string;
  original?: string;
}

export interface Song {
  id: string; // ID interno único (yt_xxx, itunes_xxx)
  title: string;
  artist: string;
  album?: string;
  duration: number; // segundos
  coverUrl: string;
  /** ID de vídeo de YouTube; vacío hasta que el resolver lo encuentra. */
  youtubeId: string;
  /** Candidatos ordenados por calidad; se prueban en orden si uno falla. */
  candidateVideoIds?: string[];
  currentVersion?: VersionType;
  availableVersions?: SongVersions;
  hasSyncedLyrics?: boolean;
}

export interface SyncedLyricLine {
  time: number; // segundos
  text: string;
}

export interface LyricsResult {
  /** true = marcas de tiempo reales (LRC); false = texto plano sin sincronizar. */
  synced: boolean;
  lines: SyncedLyricLine[];
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  releaseYear: string;
  trackCount: number;
  genre?: string;
  type: 'album' | 'single' | 'ep';
}

export interface ArtistProfile {
  id: string;
  name: string;
  pictureUrl: string;
  genre?: string;
  listeners?: number;
  topSongs: Song[];
  albums: Album[];
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl: string;
  songs: Song[];
  isCustom?: boolean;
  createdAt?: number;
}

export type RepeatMode = 'off' | 'all' | 'one';
