import { getSupabase } from './supabaseClient';
import type { Song, Playlist } from '../types/music';
import { DEFAULT_PLAYLIST_COVER } from '../lib/images';

/**
 * Sincronización con Supabase (PostgreSQL + RLS).
 *
 * - El usuario activo se inyecta desde AuthContext (`setCloudUser`), evitando
 *   una llamada de red `auth.getUser()` en cada operación.
 * - Las escrituras se serializan en una cola: "crear playlist" siempre llega
 *   antes que "añadir canción" a esa playlist (evita violaciones de FK).
 */

let cloudUserId: string | null = null;
let queue: Promise<unknown> = Promise.resolve();

export function setCloudUser(userId: string | null) {
  cloudUserId = userId;
}

export function isCloudActive(): boolean {
  return cloudUserId !== null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(id: string): boolean {
  return UUID_RE.test(id);
}

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

/** Encola una escritura en la nube (no-op para invitados). Nunca lanza. */
function enqueue(label: string, op: (userId: string) => Promise<{ error: unknown } | void>) {
  const userId = cloudUserId;
  if (!userId) return;
  queue = queue
    .then(async () => {
      const result = await op(userId);
      if (result && result.error) console.error(`[Cloud] ${label}:`, result.error);
    })
    .catch((err) => console.error(`[Cloud] ${label}:`, err));
}

function songRow(userId: string, song: Song) {
  return {
    user_id: userId,
    song_id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album || null,
    cover_url: song.coverUrl,
    duration: song.duration || 0,
  };
}

function rowToSong(row: any): Song {
  return {
    id: row.song_id,
    title: row.title,
    artist: row.artist,
    album: row.album || undefined,
    coverUrl: row.cover_url,
    duration: row.duration || 0,
    // El ID de vídeo se resuelve al reproducir; song_id NO es un ID de YouTube.
    youtubeId: '',
  };
}

// ---------------------------------------------------------------------------
// Escrituras (fire-and-forget, serializadas)
// ---------------------------------------------------------------------------

export function cloudAddLikedSong(song: Song) {
  enqueue('like', async (uid) => {
    const sb = await getSupabase();
    return sb.from('liked_songs').upsert(songRow(uid, song), { onConflict: 'user_id, song_id' });
  });
}

export function cloudRemoveLikedSong(songId: string) {
  enqueue('unlike', async (uid) => {
    const sb = await getSupabase();
    return sb.from('liked_songs').delete().eq('user_id', uid).eq('song_id', songId);
  });
}

export function cloudCreatePlaylist(playlist: Playlist) {
  enqueue('create playlist', async (uid) => {
    const sb = await getSupabase();
    return sb.from('playlists').upsert({
      id: playlist.id,
      user_id: uid,
      name: playlist.name,
      description: playlist.description || null,
      cover_url: playlist.coverUrl || null,
    });
  });
}

export function cloudUpdatePlaylistCover(playlistId: string, coverUrl: string) {
  enqueue('update cover', async (uid) => {
    const sb = await getSupabase();
    return sb.from('playlists').update({ cover_url: coverUrl }).eq('id', playlistId).eq('user_id', uid);
  });
}

export function cloudDeletePlaylist(playlistId: string) {
  enqueue('delete playlist', async (uid) => {
    const sb = await getSupabase();
    return sb.from('playlists').delete().eq('id', playlistId).eq('user_id', uid);
  });
}

export function cloudAddSongToPlaylist(playlistId: string, song: Song) {
  enqueue('add to playlist', async (uid) => {
    const sb = await getSupabase();
    return sb.from('playlist_songs').insert({ ...songRow(uid, song), playlist_id: playlistId });
  });
}

export function cloudRemoveSongFromPlaylist(playlistId: string, songId: string) {
  enqueue('remove from playlist', async (uid) => {
    const sb = await getSupabase();
    return sb
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('song_id', songId)
      .eq('user_id', uid);
  });
}

// ---------------------------------------------------------------------------
// Lectura + migración de invitado al iniciar sesión
// ---------------------------------------------------------------------------

async function fetchCloudLibrary(userId: string): Promise<{ likedSongs: Song[]; playlists: Playlist[] }> {
  const sb = await getSupabase();
  const [likes, pls, plSongs] = await Promise.all([
    sb
      .from('liked_songs')
      .select('song_id, title, artist, album, cover_url, duration, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    sb.from('playlists').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    sb.from('playlist_songs').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
  ]);

  if (likes.error) throw likes.error;
  if (pls.error) throw pls.error;
  if (plSongs.error) console.error('[Cloud] playlist_songs:', plSongs.error);

  const songsByPlaylist = new Map<string, Song[]>();
  for (const row of plSongs.data || []) {
    const list = songsByPlaylist.get(row.playlist_id) || [];
    if (!list.some((s) => s.id === row.song_id)) list.push(rowToSong(row));
    songsByPlaylist.set(row.playlist_id, list);
  }

  return {
    likedSongs: (likes.data || []).map(rowToSong),
    playlists: (pls.data || []).map((pl) => ({
      id: pl.id,
      name: pl.name,
      description: pl.description || undefined,
      coverUrl: pl.cover_url || DEFAULT_PLAYLIST_COVER,
      songs: songsByPlaylist.get(pl.id) || [],
      isCustom: true,
      createdAt: new Date(pl.created_at).getTime(),
    })),
  };
}

/**
 * Sube lo que el invitado tenía en local y devuelve la biblioteca unificada.
 * Todo en lotes (1 petición por tabla) en lugar de N peticiones secuenciales.
 */
export async function syncOnLogin(
  localLiked: Song[],
  localPlaylists: Playlist[]
): Promise<{ likedSongs: Song[]; playlists: Playlist[] } | null> {
  const userId = cloudUserId;
  if (!userId) return null;
  await queue; // deja terminar escrituras pendientes

  const cloud = await fetchCloudLibrary(userId);
  const sb = await getSupabase();

  const cloudLikeIds = new Set(cloud.likedSongs.map((s) => s.id));
  const newLikes = localLiked.filter((s) => !cloudLikeIds.has(s.id));

  const cloudIds = new Set(cloud.playlists.map((p) => p.id));
  const cloudNames = new Set(cloud.playlists.map((p) => p.name.trim().toLowerCase()));
  const newPlaylists = localPlaylists.filter(
    (p) => !cloudIds.has(p.id) && !cloudNames.has(p.name.trim().toLowerCase())
  );

  if (newLikes.length === 0 && newPlaylists.length === 0) return cloud;

  if (newLikes.length > 0) {
    const { error } = await sb
      .from('liked_songs')
      .upsert(newLikes.map((s) => songRow(userId, s)), { onConflict: 'user_id, song_id' });
    if (error) console.error('[Cloud] batch likes:', error);
  }

  if (newPlaylists.length > 0) {
    const { error } = await sb.from('playlists').upsert(
      newPlaylists.map((p) => ({
        id: p.id,
        user_id: userId,
        name: p.name,
        description: p.description || null,
        cover_url: p.coverUrl || null,
      }))
    );
    if (error) console.error('[Cloud] batch playlists:', error);

    const rows = newPlaylists.flatMap((p) => p.songs.map((s) => ({ ...songRow(userId, s), playlist_id: p.id })));
    if (rows.length > 0) {
      const { error: songsError } = await sb.from('playlist_songs').insert(rows);
      if (songsError) console.error('[Cloud] batch playlist songs:', songsError);
    }
  }

  return fetchCloudLibrary(userId);
}
