import React, { useState } from 'react';
import { Playlist, Song } from '../../types/music';
import { usePlayer } from '../../context/PlayerContext';
import {
  isSongLiked,
  toggleLikeSong,
  removeSongFromPlaylist,
  deleteCustomPlaylist,
} from '../../services/storageService';
import {
  Play,
  Pause,
  Shuffle,
  Clock,
  Heart,
  Trash2,
  Music,
  Radio,
  FileText,
  Film,
} from 'lucide-react';

interface PlaylistViewProps {
  playlist: Playlist;
  onNavigateHome: () => void;
  onNavigateArtist?: (artistName: string) => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({ playlist, onNavigateHome, onNavigateArtist }) => {
  const { currentSong, isPlaying, playSong, togglePlay, isShuffle, toggleShuffle } = usePlayer();
  const [searchFilter, setSearchFilter] = useState('');

  const totalDurationSecs = playlist.songs.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalMinutes = Math.floor(totalDurationSecs / 60);

  const filteredSongs = playlist.songs.filter(
    (s) =>
      s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (s.album && s.album.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const isPlaylistPlaying =
    isPlaying && currentSong && playlist.songs.some((s) => s.id === currentSong.id);

  const handlePlayAll = () => {
    if (playlist.songs.length === 0) return;
    if (isPlaylistPlaying) {
      togglePlay();
    } else {
      playSong(playlist.songs[0], playlist.songs);
    }
  };

  const handleShufflePlay = () => {
    if (playlist.songs.length === 0) return;
    if (!isShuffle) {
      toggleShuffle();
    }
    const randomIndex = Math.floor(Math.random() * playlist.songs.length);
    playSong(playlist.songs[randomIndex], playlist.songs);
  };

  const handleDeleteThisPlaylist = () => {
    if (confirm(`¿Eliminar la playlist "${playlist.name}"?`)) {
      deleteCustomPlaylist(playlist.id);
      onNavigateHome();
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto select-none">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 border border-white/10">
          <img
            src={playlist.coverUrl}
            alt={playlist.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-green">
            {playlist.isCustom ? 'Playlist Personalizada' : 'Playlist'}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p className="text-sm text-zinc-400 max-w-2xl">{playlist.description}</p>
          )}

          <div className="pt-2 flex items-center justify-center sm:justify-start gap-2 text-xs text-zinc-400 font-medium">
            <span className="text-white font-semibold">{playlist.songs.length} canciones</span>
            <span>•</span>
            <span>Aprox. {totalMinutes} min</span>
            <span>•</span>
            <span className="text-emerald-400">Audio Alta Fidelidad</span>
          </div>
        </div>
      </div>

      {/* 2. Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePlayAll}
            disabled={playlist.songs.length === 0}
            className="w-14 h-14 rounded-full bg-brand-green text-black flex items-center justify-center shadow-xl shadow-brand-green/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            title={isPlaylistPlaying ? 'Pausar' : 'Reproducir playlist'}
          >
            {isPlaylistPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-1" />
            )}
          </button>

          <button
            onClick={handleShufflePlay}
            disabled={playlist.songs.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors disabled:opacity-50"
            title="True Shuffle: Reproduce en orden 100% aleatorio sin sesgos"
          >
            <Shuffle className="w-4 h-4 text-cyan-400" />
            <span>True Shuffle</span>
          </button>

          {playlist.isCustom && (
            <button
              onClick={handleDeleteThisPlaylist}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-red-400 transition-colors"
              title="Eliminar playlist"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter within playlist */}
        {playlist.songs.length > 5 && (
          <input
            type="text"
            placeholder="Filtrar en esta lista..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-green w-56"
          />
        )}
      </div>

      {/* 3. Song Table */}
      {filteredSongs.length === 0 ? (
        <div className="p-16 text-center text-zinc-500 space-y-3 bg-white/[0.02] rounded-2xl border border-white/5">
          <Music className="w-12 h-12 mx-auto opacity-30 text-brand-green" />
          <p className="text-base font-semibold text-zinc-400">Esta playlist está vacía</p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Busca cualquier canción o artista y agrégala con el menú de 3 puntos.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Table Header */}
          <div className="grid grid-cols-12 px-4 py-2 text-xs font-semibold text-zinc-500 border-b border-white/10 uppercase tracking-wider">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-6 sm:col-span-5">Título</div>
            <div className="hidden sm:block sm:col-span-3">Álbum</div>
            <div className="col-span-3 sm:col-span-2 text-center">Versión</div>
            <div className="col-span-2 sm:col-span-1 text-right flex items-center justify-end gap-1">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Song Rows */}
          {filteredSongs.map((song, idx) => {
            const isCurrent = currentSong?.id === song.id;
            const isLiked = isSongLiked(song.id);

            return (
              <div
                key={`${song.id}-${idx}`}
                onClick={() => playSong(song, playlist.songs)}
                className={`group grid grid-cols-12 items-center px-4 py-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                  isCurrent
                    ? 'bg-white/15 text-brand-green font-semibold'
                    : 'text-zinc-300 hover:bg-white/5'
                }`}
              >
                {/* Index / Play icon */}
                <div className="col-span-1 text-center font-mono text-zinc-500 group-hover:text-white">
                  {isCurrent && isPlaying ? (
                    <div className="flex items-end justify-center gap-0.5 h-3">
                      <span className="w-0.5 bg-brand-green h-full animate-pulse" />
                      <span className="w-0.5 bg-brand-green h-2/3 animate-pulse" />
                      <span className="w-0.5 bg-brand-green h-4/5 animate-pulse" />
                    </div>
                  ) : (
                    <span className="group-hover:hidden">{idx + 1}</span>
                  )}
                  <Play className="w-3 h-3 mx-auto hidden group-hover:block fill-current" />
                </div>

                {/* Title & Cover & Artist */}
                <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0 pr-2">
                  <img
                    src={song.coverUrl}
                    alt={song.title}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p
                      className={`truncate text-sm font-semibold ${
                        isCurrent ? 'text-brand-green' : 'text-white'
                      }`}
                    >
                      {song.title}
                    </p>
                    <p
                      onClick={(e) => {
                        if (onNavigateArtist) {
                          e.stopPropagation();
                          onNavigateArtist(song.artist);
                        }
                      }}
                      className={`truncate text-xs text-zinc-400 ${
                        onNavigateArtist ? 'hover:underline hover:text-white cursor-pointer' : ''
                      }`}
                    >
                      {song.artist}
                    </p>
                  </div>
                </div>

                {/* Album */}
                <div className="hidden sm:block sm:col-span-3 truncate text-zinc-400 pr-2">
                  {song.album || '—'}
                </div>

                {/* Version badge */}
                <div className="col-span-3 sm:col-span-2 text-center">
                  {song.currentVersion === 'radio' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <Radio className="w-2.5 h-2.5" /> Radio
                    </span>
                  ) : song.currentVersion === 'lyrics' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                      <FileText className="w-2.5 h-2.5" /> Lyrics
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                      <Film className="w-2.5 h-2.5" /> Original
                    </span>
                  )}
                </div>

                {/* Duration & Like action */}
                <div className="col-span-2 sm:col-span-1 flex items-center justify-end gap-2 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLikeSong(song);
                    }}
                    className={`p-1 rounded-full transition-colors ${
                      isLiked
                        ? 'text-brand-green'
                        : 'text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                  </button>

                  {playlist.isCustom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSongFromPlaylist(playlist.id, song.id);
                      }}
                      className="p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Eliminar de esta playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <span className="font-mono text-zinc-400">
                    {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
