import type { Playlist, Song } from '../types/music';
import { createStore, useStore } from '../lib/store';
import { safeStorage } from '../lib/net';
import { DEFAULT_PLAYLIST_COVER } from '../lib/images';
import {
  generateUUID,
  isValidUUID,
  cloudAddLikedSong,
  cloudRemoveLikedSong,
  cloudCreatePlaylist,
  cloudDeletePlaylist,
  cloudAddSongToPlaylist,
  cloudRemoveSongFromPlaylist,
  cloudUpdatePlaylistCover,
  syncOnLogin,
} from './cloudStorageService';

/**
 * Biblioteca del usuario (favoritos, playlists, historial, ajustes).
 *
 * Antes: cada tarjeta hacía JSON.parse(localStorage) en cada render.
 * Ahora: estado en memoria reactivo (store) + persistencia write-through en
 * localStorage + sincronización en segundo plano con Supabase.
 */

const LIKED_SONGS_KEY = 'free_spoty_liked_songs';
const CUSTOM_PLAYLISTS_KEY = 'free_spoty_custom_playlists';
const HISTORY_KEY = 'free_spoty_history';
const SETTINGS_KEY = 'free_spoty_settings';
const FOLLOWED_KEY = 'free_spoty_followed_artists';
const HISTORY_LIMIT = 50;

export interface AppSettings {
  trueShuffle: boolean;
  volume: number;
  playbackRate: number;
  eqPreset: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  trueShuffle: true,
  volume: 85,
  playbackRate: 1,
  eqPreset: 'flat',
};

export interface FollowedArtist {
  name: string;
  pictureUrl: string;
}

interface LibraryState {
  likedSongs: Song[];
  likedIds: Set<string>;
  playlists: Playlist[];
  history: Song[];
  followedArtists: FollowedArtist[];
}

/** Guarda solo metadatos: los IDs de vídeo caducan y se re-resuelven al reproducir. */
export function slimSong(song: Song): Song {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    duration: song.duration,
    coverUrl: song.coverUrl,
    youtubeId: song.id.startsWith('yt_') ? song.youtubeId : '',
    candidateVideoIds: song.id.startsWith('yt_') ? song.candidateVideoIds : undefined,
  };
}

function loadPlaylists(): Playlist[] {
  const raw = safeStorage.get<Playlist[]>(CUSTOM_PLAYLISTS_KEY, []);
  let migrated = false;
  // Migración: IDs antiguos no-UUID rompían la sincronización con PostgreSQL
  const playlists = raw.map((p) => {
    if (isValidUUID(p.id)) return p;
    migrated = true;
    return { ...p, id: generateUUID() };
  });
  if (migrated) safeStorage.set(CUSTOM_PLAYLISTS_KEY, playlists);
  return playlists;
}

function loadState(): LibraryState {
  const likedSongs = safeStorage.get<Song[]>(LIKED_SONGS_KEY, []);
  return {
    likedSongs,
    likedIds: new Set(likedSongs.map((s) => s.id)),
    playlists: loadPlaylists(),
    history: safeStorage.get<Song[]>(HISTORY_KEY, []),
    followedArtists: safeStorage.get<FollowedArtist[]>(FOLLOWED_KEY, []),
  };
}

export const libraryStore = createStore<LibraryState>(loadState());

function setLiked(likedSongs: Song[]) {
  libraryStore.set({ likedSongs, likedIds: new Set(likedSongs.map((s) => s.id)) });
  safeStorage.set(LIKED_SONGS_KEY, likedSongs);
}

function setPlaylists(playlists: Playlist[]) {
  libraryStore.set({ playlists });
  safeStorage.set(CUSTOM_PLAYLISTS_KEY, playlists);
}

// Sincronización entre pestañas abiertas
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if ([LIKED_SONGS_KEY, CUSTOM_PLAYLISTS_KEY, HISTORY_KEY, FOLLOWED_KEY].includes(e.key || '')) {
      libraryStore.set(loadState());
    }
  });
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useIsLiked(songId: string | undefined): boolean {
  return useStore(libraryStore, (s) => (songId ? s.likedIds.has(songId) : false));
}

export function useLikedSongs(): Song[] {
  return useStore(libraryStore, (s) => s.likedSongs);
}

export function usePlaylists(): Playlist[] {
  return useStore(libraryStore, (s) => s.playlists);
}

export function useHistory(): Song[] {
  return useStore(libraryStore, (s) => s.history);
}

export function useFollowedArtists(): FollowedArtist[] {
  return useStore(libraryStore, (s) => s.followedArtists);
}

export function useIsFollowing(name: string): boolean {
  return useStore(libraryStore, (s) => s.followedArtists.some((a) => a.name.toLowerCase() === name.toLowerCase()));
}

// ---------------------------------------------------------------------------
// Artistas seguidos (solo local)
// ---------------------------------------------------------------------------

export function toggleFollowArtist(artist: FollowedArtist): boolean {
  const list = libraryStore.get().followedArtists;
  const exists = list.some((a) => a.name.toLowerCase() === artist.name.toLowerCase());
  const next = exists
    ? list.filter((a) => a.name.toLowerCase() !== artist.name.toLowerCase())
    : [artist, ...list];
  libraryStore.set({ followedArtists: next });
  safeStorage.set(FOLLOWED_KEY, next);
  return !exists;
}

// ---------------------------------------------------------------------------
// Favoritos
// ---------------------------------------------------------------------------

export function isSongLiked(songId: string): boolean {
  return libraryStore.get().likedIds.has(songId);
}

export function toggleLikeSong(song: Song): boolean {
  const { likedSongs, likedIds } = libraryStore.get();
  if (likedIds.has(song.id)) {
    setLiked(likedSongs.filter((s) => s.id !== song.id));
    cloudRemoveLikedSong(song.id);
    return false;
  }
  const s = slimSong(song);
  setLiked([s, ...likedSongs]);
  cloudAddLikedSong(s);
  return true;
}

// ---------------------------------------------------------------------------
// Playlists
// ---------------------------------------------------------------------------

export function getCustomPlaylists(): Playlist[] {
  return libraryStore.get().playlists;
}

export function saveCustomPlaylist(name: string, description?: string): Playlist {
  const playlist: Playlist = {
    id: generateUUID(),
    name,
    description: description || 'Playlist personalizada en Free-Spoty',
    coverUrl: DEFAULT_PLAYLIST_COVER,
    songs: [],
    isCustom: true,
    createdAt: Date.now(),
  };
  setPlaylists([...libraryStore.get().playlists, playlist]);
  cloudCreatePlaylist(playlist);
  return playlist;
}

export function addSongToPlaylist(playlistId: string, song: Song): boolean {
  const playlists = libraryStore.get().playlists;
  const target = playlists.find((p) => p.id === playlistId);
  if (!target || target.songs.some((s) => s.id === song.id)) return false;

  const s = slimSong(song);
  const isFirst = target.songs.length === 0 && !!s.coverUrl;
  const updated: Playlist = {
    ...target,
    songs: [...target.songs, s],
    coverUrl: isFirst ? s.coverUrl : target.coverUrl,
  };
  setPlaylists(playlists.map((p) => (p.id === playlistId ? updated : p)));
  cloudAddSongToPlaylist(playlistId, s);
  if (isFirst) cloudUpdatePlaylistCover(playlistId, s.coverUrl);
  return true;
}

export function createPlaylistWithSong(name: string, song: Song, description?: string): Playlist {
  const pl = saveCustomPlaylist(name, description);
  addSongToPlaylist(pl.id, song);
  return pl;
}

export function removeSongFromPlaylist(playlistId: string, songId: string): void {
  setPlaylists(
    libraryStore
      .get()
      .playlists.map((p) => (p.id === playlistId ? { ...p, songs: p.songs.filter((s) => s.id !== songId) } : p))
  );
  cloudRemoveSongFromPlaylist(playlistId, songId);
}

export function deleteCustomPlaylist(playlistId: string): void {
  setPlaylists(libraryStore.get().playlists.filter((p) => p.id !== playlistId));
  cloudDeletePlaylist(playlistId);
}

// ---------------------------------------------------------------------------
// Sesión en la nube
// ---------------------------------------------------------------------------

export async function syncLocalAndCloudData(): Promise<void> {
  try {
    const { likedSongs, playlists } = libraryStore.get();
    const synced = await syncOnLogin(likedSongs, playlists);
    if (!synced) return;
    setLiked(synced.likedSongs);
    setPlaylists(synced.playlists);
  } catch (err) {
    console.error('Error sincronizando biblioteca local y nube:', err);
  }
}

/** Al cerrar sesión se limpian favoritos y playlists (se conservan historial y ajustes). */
export function resetUserDataOnSignOut(): void {
  setLiked([]);
  setPlaylists([]);
}

// ---------------------------------------------------------------------------
// Historial
// ---------------------------------------------------------------------------

export function addToPlayHistory(song: Song) {
  const s = slimSong(song);
  const history = [s, ...libraryStore.get().history.filter((h) => h.id !== s.id)].slice(0, HISTORY_LIMIT);
  libraryStore.set({ history });
  safeStorage.set(HISTORY_KEY, history);
}

// ---------------------------------------------------------------------------
// Ajustes
// ---------------------------------------------------------------------------

export function getSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS, ...safeStorage.get<Partial<AppSettings>>(SETTINGS_KEY, {}) };
}

export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  const updated = { ...getSettings(), ...partial };
  safeStorage.set(SETTINGS_KEY, updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Copias de seguridad
// ---------------------------------------------------------------------------

export function exportAllUserData(): string {
  const { likedSongs, playlists, history } = libraryStore.get();
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      likedSongs,
      customPlaylists: playlists,
      history,
      settings: getSettings(),
    },
    null,
    2
  );
}

export function importUserData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (Array.isArray(data.likedSongs)) {
      const newOnes = (data.likedSongs as Song[]).filter((s) => !isSongLiked(s.id));
      setLiked([...libraryStore.get().likedSongs, ...newOnes.map(slimSong)]);
      newOnes.forEach(cloudAddLikedSong);
    }
    if (Array.isArray(data.customPlaylists)) {
      const existing = libraryStore.get().playlists;
      const incoming = (data.customPlaylists as Playlist[])
        .filter((p) => !existing.some((e) => e.id === p.id))
        .map((p) => ({ ...p, id: isValidUUID(p.id) ? p.id : generateUUID(), isCustom: true }));
      setPlaylists([...existing, ...incoming]);
      incoming.forEach((p) => {
        cloudCreatePlaylist(p);
        p.songs.forEach((s) => cloudAddSongToPlaylist(p.id, s));
      });
    }
    if (Array.isArray(data.history)) {
      libraryStore.set({ history: data.history.slice(0, HISTORY_LIMIT) });
      safeStorage.set(HISTORY_KEY, data.history.slice(0, HISTORY_LIMIT));
    }
    if (data.settings && typeof data.settings === 'object') {
      updateSettings(data.settings);
    }
    return true;
  } catch (e) {
    console.error('Import failed:', e);
    return false;
  }
}
