export type VersionType = 'radio' | 'lyrics' | 'original';

export interface SyncedLyricLine {
  time: number; // in seconds
  text: string;
}

export interface SongVersions {
  radio?: string;    // YouTube Video ID for Radio Edit / Clean
  lyrics?: string;   // YouTube Video ID for Lyric Video
  original?: string; // YouTube Video ID for Original / Official
}

export interface Song {
  id: string; // Unique internal ID (e.g. yt_xxx or itunes_xxx)
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  coverUrl: string;
  youtubeId: string;
  currentVersion: VersionType;
  availableVersions?: SongVersions;
  candidateVideoIds?: string[];
  hasSyncedLyrics?: boolean;
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

export interface EqualizerSetting {
  name: string;
  bass: number; // -10 to 10
  mid: number;
  treble: number;
}

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0 to 100
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  playbackRate: number; // 0.75, 1, 1.25, 1.5, etc.
  sleepTimerSeconds: number | null; // remaining seconds or null
  activeVersion: VersionType;
  isLoadingSong: boolean;
}
