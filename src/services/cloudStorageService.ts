import { supabase } from './supabaseClient';
import { Song, Playlist } from '../types/music';

// Helper to ensure valid UUID format for PostgreSQL UUID column
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function ensureValidUUID(id: string): string {
  // Regex test for standard UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id;
  }
  return generateUUID();
}

/**
 * Fetch liked songs from Supabase Cloud for current user
 */
export async function fetchCloudLikedSongs(): Promise<Song[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('liked_songs')
    .select('song_id, title, artist, album, cover_url, duration, created_at')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching cloud liked songs:', error);
    return [];
  }

  return data.map((row) => ({
    id: row.song_id,
    title: row.title,
    artist: row.artist,
    album: row.album || undefined,
    coverUrl: row.cover_url,
    duration: row.duration || 0,
    youtubeId: row.song_id,
    currentVersion: 'radio' as const,
  }));
}

/**
 * Sync add liked song to Supabase
 */
export async function syncCloudAddLikedSong(song: Song): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('liked_songs').upsert(
    {
      user_id: user.id,
      song_id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album || null,
      cover_url: song.coverUrl,
      duration: song.duration || 0,
    },
    { onConflict: 'user_id, song_id' }
  );

  if (error) {
    console.error('Error syncing liked song to cloud:', error);
  }
}

/**
 * Sync remove liked song from Supabase
 */
export async function syncCloudRemoveLikedSong(songId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('liked_songs')
    .delete()
    .eq('user_id', user.id)
    .eq('song_id', songId);

  if (error) {
    console.error('Error removing liked song from cloud:', error);
  }
}

/**
 * Fetch custom playlists and their songs from Supabase
 */
export async function fetchCloudPlaylists(): Promise<Playlist[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: playlistsData, error: plError } = await supabase
    .from('playlists')
    .select('*')
    .order('created_at', { ascending: true });

  if (plError || !playlistsData) {
    console.error('Error fetching cloud playlists:', plError);
    return [];
  }

  const { data: songsData, error: songsError } = await supabase
    .from('playlist_songs')
    .select('*')
    .order('created_at', { ascending: true });

  if (songsError) {
    console.error('Error fetching cloud playlist songs:', songsError);
  }

  const songsMap: Record<string, Song[]> = {};
  (songsData || []).forEach((row) => {
    if (!songsMap[row.playlist_id]) {
      songsMap[row.playlist_id] = [];
    }
    songsMap[row.playlist_id].push({
      id: row.song_id,
      title: row.title,
      artist: row.artist,
      album: row.album || undefined,
      coverUrl: row.cover_url,
      duration: row.duration || 0,
      youtubeId: row.song_id,
      currentVersion: 'radio' as const,
    });
  });

  return playlistsData.map((pl) => ({
    id: pl.id,
    name: pl.name,
    description: pl.description || 'Playlist de Free-Spoty',
    coverUrl: pl.cover_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    songs: songsMap[pl.id] || [],
    isCustom: true,
    createdAt: new Date(pl.created_at).getTime(),
  }));
}

/**
 * Sync create playlist to Supabase
 */
export async function syncCloudCreatePlaylist(playlist: Playlist): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const validId = ensureValidUUID(playlist.id);

  const { error } = await supabase.from('playlists').upsert({
    id: validId,
    user_id: user.id,
    name: playlist.name,
    description: playlist.description || null,
    cover_url: playlist.coverUrl || null,
  });

  if (error) {
    console.error('Error syncing create playlist to cloud:', error);
  }
}

/**
 * Sync delete playlist from Supabase
 */
export async function syncCloudDeletePlaylist(playlistId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', playlistId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting playlist from cloud:', error);
  }
}

/**
 * Sync add song to playlist in Supabase
 */
export async function syncCloudAddSongToPlaylist(playlistId: string, song: Song): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('playlist_songs').insert({
    playlist_id: playlistId,
    user_id: user.id,
    song_id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album || null,
    cover_url: song.coverUrl,
    duration: song.duration || 0,
  });

  if (error) {
    console.error('Error syncing song to playlist in cloud:', error);
  }
}

/**
 * Sync remove song from playlist in Supabase
 */
export async function syncCloudRemoveSongFromPlaylist(playlistId: string, songId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('playlist_songs')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('song_id', songId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error removing song from playlist in cloud:', error);
  }
}

/**
 * Smart migration & sync when user authenticates
 * Uploads any existing guest data from localStorage to Supabase, then fetches cloud data
 */
export async function syncOnLogin(localLikedSongs: Song[], localPlaylists: Playlist[]): Promise<{
  likedSongs: Song[];
  playlists: Playlist[];
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { likedSongs: localLikedSongs, playlists: localPlaylists };

  // 1. Fetch cloud data first
  const cloudLikes = await fetchCloudLikedSongs();
  const cloudPlaylists = await fetchCloudPlaylists();

  // 2. Upload any local liked songs not in cloud yet
  const cloudLikeIds = new Set(cloudLikes.map((s) => s.id));
  const newLikesToUpload = localLikedSongs.filter((s) => !cloudLikeIds.has(s.id));

  for (const song of newLikesToUpload) {
    await syncCloudAddLikedSong(song);
  }

  // 3. Upload any local playlists not in cloud yet
  const cloudPlaylistNames = new Set(cloudPlaylists.map((p) => p.name.toLowerCase().trim()));
  const newPlaylistsToUpload = localPlaylists.filter((p) => !cloudPlaylistNames.has(p.name.toLowerCase().trim()));

  for (const pl of newPlaylistsToUpload) {
    const validId = ensureValidUUID(pl.id);
    const updatedPl = { ...pl, id: validId };
    await syncCloudCreatePlaylist(updatedPl);
    for (const song of updatedPl.songs) {
      await syncCloudAddSongToPlaylist(validId, song);
    }
  }

  // 4. Fetch final unified state from cloud
  const finalLikes = await fetchCloudLikedSongs();
  const finalPlaylists = await fetchCloudPlaylists();

  return {
    likedSongs: finalLikes.length > 0 ? finalLikes : localLikedSongs,
    playlists: finalPlaylists.length > 0 ? finalPlaylists : localPlaylists,
  };
}
