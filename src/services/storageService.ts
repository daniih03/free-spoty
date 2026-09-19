import { Playlist, Song } from '../types/music';
import {
  generateUUID,
  syncCloudAddLikedSong,
  syncCloudRemoveLikedSong,
  syncCloudCreatePlaylist,
  syncCloudDeletePlaylist,
  syncCloudAddSongToPlaylist,
  syncCloudRemoveSongFromPlaylist,
  syncOnLogin,
} from './cloudStorageService';

const LIKED_SONGS_KEY = 'free_spoty_liked_songs';
const CUSTOM_PLAYLISTS_KEY = 'free_spoty_custom_playlists';
const HISTORY_KEY = 'free_spoty_history';
const SETTINGS_KEY = 'free_spoty_settings';

export interface AppSettings {
  trueShuffle: boolean;
  normalizeAudio: boolean;
  volume: number;
  quality: 'high' | 'normal';
}

const DEFAULT_SETTINGS: AppSettings = {
  trueShuffle: true,
  normalizeAudio: true,
  volume: 85,
  quality: 'high',
};

// Liked Songs
export function getLikedSongs(): Song[] {
  try {
    const raw = localStorage.getItem(LIKED_SONGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isSongLiked(songId: string): boolean {
  const songs = getLikedSongs();
  return songs.some(s => s.id === songId);
}

export function toggleLikeSong(song: Song): boolean {
  const songs = getLikedSongs();
  const existsIndex = songs.findIndex(s => s.id === song.id);
  let isNowLiked = false;

  if (existsIndex >= 0) {
    songs.splice(existsIndex, 1);
    isNowLiked = false;
    // Async background sync with Supabase
    syncCloudRemoveLikedSong(song.id).catch(console.error);
  } else {
    songs.unshift(song);
    isNowLiked = true;
    // Async background sync with Supabase
    syncCloudAddLikedSong(song).catch(console.error);
  }

  localStorage.setItem(LIKED_SONGS_KEY, JSON.stringify(songs));
  window.dispatchEvent(new Event('free_spoty_storage_change'));
  return isNowLiked;
}

// Custom Playlists
export function getCustomPlaylists(): Playlist[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PLAYLISTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomPlaylist(name: string, description?: string): Playlist {
  const playlists = getCustomPlaylists();
  const newPlaylist: Playlist = {
    id: generateUUID(),
    name,
    description: description || 'Playlist personalizada en Free-Spoty',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    songs: [],
    isCustom: true,
    createdAt: Date.now(),
  };

  playlists.push(newPlaylist);
  localStorage.setItem(CUSTOM_PLAYLISTS_KEY, JSON.stringify(playlists));
  window.dispatchEvent(new Event('free_spoty_storage_change'));

  // Async background sync with Supabase
  syncCloudCreatePlaylist(newPlaylist).catch(console.error);

  return newPlaylist;
}

export function createPlaylistWithSong(name: string, song: Song, description?: string): Playlist {
  const pl = saveCustomPlaylist(name, description);
  addSongToPlaylist(pl.id, song);
  return pl;
}

export function addSongToPlaylist(playlistId: string, song: Song): boolean {
  const playlists = getCustomPlaylists();
  const pl = playlists.find(p => p.id === playlistId);
  if (!pl) return false;

  if (!pl.songs.some(s => s.id === song.id)) {
    pl.songs.push(song);
    if (pl.songs.length === 1 && song.coverUrl) {
      pl.coverUrl = song.coverUrl;
    }
    localStorage.setItem(CUSTOM_PLAYLISTS_KEY, JSON.stringify(playlists));
    window.dispatchEvent(new Event('free_spoty_storage_change'));

    // Async background sync with Supabase
    syncCloudAddSongToPlaylist(playlistId, song).catch(console.error);
    return true;
  }
  return false;
}

export function removeSongFromPlaylist(playlistId: string, songId: string): boolean {
  const playlists = getCustomPlaylists();
  const pl = playlists.find(p => p.id === playlistId);
  if (!pl) return false;

  pl.songs = pl.songs.filter(s => s.id !== songId);
  localStorage.setItem(CUSTOM_PLAYLISTS_KEY, JSON.stringify(playlists));
  window.dispatchEvent(new Event('free_spoty_storage_change'));

  // Async background sync with Supabase
  syncCloudRemoveSongFromPlaylist(playlistId, songId).catch(console.error);
  return true;
}

export function deleteCustomPlaylist(playlistId: string): boolean {
  let playlists = getCustomPlaylists();
  playlists = playlists.filter(p => p.id !== playlistId);
  localStorage.setItem(CUSTOM_PLAYLISTS_KEY, JSON.stringify(playlists));
  window.dispatchEvent(new Event('free_spoty_storage_change'));

  // Async background sync with Supabase
  syncCloudDeletePlaylist(playlistId).catch(console.error);
  return true;
}

// Full Cloud Sync upon Login / Register
export async function syncLocalAndCloudData(): Promise<void> {
  try {
    const localLikes = getLikedSongs();
    const localPlaylists = getCustomPlaylists();
    const synced = await syncOnLogin(localLikes, localPlaylists);

    localStorage.setItem(LIKED_SONGS_KEY, JSON.stringify(synced.likedSongs));
    localStorage.setItem(CUSTOM_PLAYLISTS_KEY, JSON.stringify(synced.playlists));
    window.dispatchEvent(new Event('free_spoty_storage_change'));
  } catch (err) {
    console.error('Error syncing local and cloud data:', err);
  }
}

// Reset data on explicit sign out (keeps settings and history)
export function resetUserDataOnSignOut(): void {
  localStorage.removeItem(LIKED_SONGS_KEY);
  localStorage.removeItem(CUSTOM_PLAYLISTS_KEY);
  window.dispatchEvent(new Event('free_spoty_storage_change'));
}

// Play History
export function getPlayHistory(): Song[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToPlayHistory(song: Song) {
  try {
    let history = getPlayHistory();
    // Remove if already exists to push to top
    history = history.filter(s => s.id !== song.id);
    history.unshift(song);
    // Limit to last 50 songs
    if (history.length > 50) history = history.slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    window.dispatchEvent(new Event('free_spoty_storage_change'));
  } catch (e) {
    console.warn('Could not save history:', e);
  }
}

// Settings
export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated = { ...current, ...partial };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}

// Export and Import
export function exportAllUserData(): string {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    likedSongs: getLikedSongs(),
    customPlaylists: getCustomPlaylists(),
    history: getPlayHistory(),
    settings: getSettings(),
  };
  return JSON.stringify(data, null, 2);
}

export function importUserData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.likedSongs && Array.isArray(data.likedSongs)) {
      localStorage.setItem(LIKED_SONGS_KEY, JSON.stringify(data.likedSongs));
    }
    if (data.customPlaylists && Array.isArray(data.customPlaylists)) {
      localStorage.setItem(CUSTOM_PLAYLISTS_KEY, JSON.stringify(data.customPlaylists));
    }
    if (data.history && Array.isArray(data.history)) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(data.history));
    }
    if (data.settings) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
    }
    window.dispatchEvent(new Event('free_spoty_storage_change'));
    return true;
  } catch (e) {
    console.error('Import failed:', e);
    return false;
  }
}
