import React, { useDeferredValue, useMemo, useState } from 'react';
import { Play, Pause, Shuffle, Trash2, Music, LayoutList, LayoutGrid } from 'lucide-react';
import type { Playlist } from '../../types/music';
import { usePlayer, playerActions, playerStore } from '../../state/player';
import { removeSongFromPlaylist, deleteCustomPlaylist } from '../../services/storageService';
import { SongCard } from '../UI/SongCard';
import { TrackRow } from '../UI/TrackRow';
import { Cover } from '../UI/Primitives';

interface PlaylistViewProps {
  playlist: Playlist | null;
  onNavigateHome: () => void;
  onNavigateArtist: (artistName: string) => void;
}

export default function PlaylistView({ playlist, onNavigateHome, onNavigateArtist }: PlaylistViewProps) {
  const [filter, setFilter] = useState('');
  const [viewMode, setViewMode] = useState<'stream' | 'gallery'>('stream');
  const deferredFilter = useDeferredValue(filter);
  const songs = playlist?.songs ?? [];

  // ¿Suena alguna canción de esta playlist? (primitivo → re-render solo al cambiar)
  const songIds = useMemo(() => new Set(songs.map((s) => s.id)), [songs]);
  const isPlaylistPlaying = usePlayer((s) => s.isPlaying && !!s.currentSong && songIds.has(s.currentSong.id));

  const filtered = useMemo(() => {
    const q = deferredFilter.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        (s.album && s.album.toLowerCase().includes(q))
    );
  }, [songs, deferredFilter]);

  if (!playlist) {
    return (
      <div className="p-10 text-center space-y-4">
        <Music className="w-14 h-14 text-zinc-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Esta playlist ya no existe</h2>
        <button onClick={onNavigateHome} className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm">
          Volver al inicio
        </button>
      </div>
    );
  }

  const totalMinutes = Math.round(songs.reduce((acc, s) => acc + (s.duration || 0), 0) / 60);

  const handlePlayAll = () => {
    if (!songs.length) return;
    if (isPlaylistPlaying) playerActions.togglePlay();
    else playerActions.playSong(songs[0], songs);
  };

  const handleShufflePlay = () => {
    if (!songs.length) return;
    if (!playerStore.get().isShuffle) playerActions.toggleShuffle();
    playerActions.playSong(songs[Math.floor(Math.random() * songs.length)], songs);
  };

  const handleDelete = () => {
    if (confirm(`¿Eliminar la playlist "${playlist.name}"?`)) {
      deleteCustomPlaylist(playlist.id);
      onNavigateHome();
    }
  };

  const modeBtn = (active: boolean) =>
    `p-1.5 rounded-xl transition-colors ${
      active ? 'bg-gradient-to-r from-brand-crimson to-brand-red text-white shadow-md' : 'text-zinc-400 hover:text-white'
    }`;

  return (
    <div className="w-full max-w-7xl mx-auto p-3.5 sm:p-4 md:p-8 space-y-6 md:space-y-8 min-w-0">
      {/* 1. Cabecera */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6 p-4 sm:p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl min-w-0">
        <div className="w-36 h-36 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 border border-white/10">
          <Cover src={playlist.coverUrl} size={420} eager alt={playlist.name} className="w-full h-full" />
        </div>
        <div className="flex-1 min-w-0 w-full text-center sm:text-left space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-coral">
            {playlist.isCustom ? 'Playlist personalizada' : 'Playlist'}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight break-words">{playlist.name}</h1>
          {playlist.description && <p className="text-sm text-zinc-400 max-w-2xl">{playlist.description}</p>}
          <div className="pt-2 flex items-center justify-center sm:justify-start gap-2 text-xs text-zinc-400 font-medium flex-wrap">
            <span className="text-white font-semibold">{songs.length} canciones</span>
            <span>•</span>
            <span>Aprox. {totalMinutes} min</span>
            <span>•</span>
            <span className="text-brand-coral font-medium">Audio alta fidelidad</span>
          </div>
        </div>
      </div>

      {/* 2. Barra de acciones */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePlayAll}
            disabled={!songs.length}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-crimson to-brand-red hover:from-brand-red hover:to-brand-coral text-white flex items-center justify-center shadow-xl shadow-brand-red/35 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            title={isPlaylistPlaying ? 'Pausar' : 'Reproducir playlist'}
          >
            {isPlaylistPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-1" />}
          </button>
          <button
            onClick={handleShufflePlay}
            disabled={!songs.length}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors disabled:opacity-50"
            title="True Shuffle: orden 100% aleatorio sin sesgos"
          >
            <Shuffle className="w-4 h-4 text-brand-coral" />
            <span>True Shuffle</span>
          </button>
          {playlist.isCustom && (
            <button
              onClick={handleDelete}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-red-400 transition-colors"
              title="Eliminar playlist"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 min-w-0">
          {songs.length > 5 && (
            <input
              type="search"
              placeholder="Filtrar en esta lista..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-coral w-40 sm:w-56 min-w-0"
            />
          )}
          <div className="flex items-center gap-1 p-1 bg-[#141520]/80 border border-white/10 rounded-2xl backdrop-blur-md shrink-0">
            <button onClick={() => setViewMode('stream')} className={modeBtn(viewMode === 'stream')} title="Vista Stream">
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode('gallery')} className={modeBtn(viewMode === 'gallery')} title="Vista Galería">
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Canciones */}
      {filtered.length === 0 ? (
        <div className="p-10 sm:p-16 text-center text-zinc-500 space-y-3 bg-[#13141f]/30 rounded-3xl border border-white/5">
          <Music className="w-12 h-12 mx-auto opacity-30 text-brand-coral" />
          <p className="text-base font-semibold text-zinc-400">
            {songs.length === 0 ? 'Esta playlist está vacía' : 'Ninguna canción coincide con el filtro'}
          </p>
          {songs.length === 0 && (
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Busca cualquier canción o artista y añádela con el menú de 3 puntos.
            </p>
          )}
        </div>
      ) : viewMode === 'stream' ? (
        <div className="space-y-2">
          {filtered.map((song) => (
            <TrackRow
              key={song.id}
              song={song}
              contextQueue={songs}
              onNavigateArtist={onNavigateArtist}
              onRemove={playlist.isCustom ? () => removeSongFromPlaylist(playlist.id, song.id) : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {filtered.map((song) => (
            <SongCard key={song.id} song={song} contextQueue={songs} onNavigateArtist={onNavigateArtist} />
          ))}
        </div>
      )}
    </div>
  );
}
