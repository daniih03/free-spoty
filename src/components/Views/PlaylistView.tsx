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
  LayoutList,
  LayoutGrid,
} from 'lucide-react';
import { SongCard } from '../UI/SongCard';

interface PlaylistViewProps {
  playlist: Playlist;
  onNavigateHome: () => void;
  onNavigateArtist?: (artistName: string) => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({ playlist, onNavigateHome, onNavigateArtist }) => {
  const { currentSong, isPlaying, playSong, togglePlay, isShuffle, toggleShuffle } = usePlayer();
  const [searchFilter, setSearchFilter] = useState('');
  const [viewMode, setViewMode] = useState<'stream' | 'gallery'>('stream');

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
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto select-none">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6 p-4 sm:p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
        <div className="relative w-36 h-36 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 border border-white/10">
          <img
            src={playlist.coverUrl}
            alt={playlist.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-coral">
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
            <span className="text-brand-coral font-medium">Audio Alta Fidelidad</span>
          </div>
        </div>
      </div>

      {/* 2. Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePlayAll}
            disabled={playlist.songs.length === 0}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-crimson to-brand-red hover:from-brand-red hover:to-brand-coral text-white flex items-center justify-center shadow-xl shadow-brand-red/35 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            title={isPlaylistPlaying ? 'Pausar' : 'Reproducir playlist'}
          >
            {isPlaylistPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-1" />
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

        {/* Filter and View mode controls */}
        <div className="flex items-center gap-2.5">
          {playlist.songs.length > 5 && (
            <input
              type="text"
              placeholder="Filtrar en esta lista..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-coral w-44 sm:w-56"
            />
          )}

          <div className="flex items-center gap-1 p-1 bg-[#141520]/80 border border-white/10 rounded-2xl backdrop-blur-md">
            <button
              onClick={() => setViewMode('stream')}
              className={`p-1.5 rounded-xl transition-colors ${
                viewMode === 'stream'
                  ? 'bg-gradient-to-r from-brand-crimson to-brand-red text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Vista Stream"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('gallery')}
              className={`p-1.5 rounded-xl transition-colors ${
                viewMode === 'gallery'
                  ? 'bg-gradient-to-r from-brand-crimson to-brand-red text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Vista Galería"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Song Presentation */}
      {filteredSongs.length === 0 ? (
        <div className="p-16 text-center text-zinc-500 space-y-3 bg-[#13141f]/30 rounded-3xl border border-white/5">
          <Music className="w-12 h-12 mx-auto opacity-30 text-brand-coral" />
          <p className="text-base font-semibold text-zinc-400">Esta playlist está vacía</p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Busca cualquier canción o artista y agrégala con el menú de 3 puntos.
          </p>
        </div>
      ) : viewMode === 'stream' ? (
        <div className="space-y-2">
          {/* Tracklist items without Spotify table headers */}
          {filteredSongs.map((song, idx) => {
            const isCurrent = currentSong?.id === song.id;
            const isLiked = isSongLiked(song.id);

            return (
              <div
                key={`${song.id}-${idx}`}
                onClick={() => playSong(song, playlist.songs)}
                className={`group flex items-center justify-between p-3 rounded-2xl backdrop-blur-xl transition-all duration-200 cursor-pointer border transform-gpu hover:-translate-y-0.5 ${
                  isCurrent
                    ? 'bg-brand-burgundy/30 border-brand-red/50 shadow-[0_4px_24px_rgba(200,25,0,0.18)]'
                    : 'bg-[#13141f]/40 hover:bg-[#191b29]/75 border-white/[0.05] hover:border-brand-red/30'
                }`}
              >
                {/* Left: Artwork + Title + Artist */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md bg-white/[0.03] border border-white/10">
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
                      }}
                      className="w-full h-full object-cover bg-zinc-800"
                    />

                    {/* Soundwave or Play button */}
                    {isCurrent && isPlaying ? (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-0.5">
                        <span className="w-0.5 h-3 bg-brand-coral rounded-full animate-pulse" />
                        <span className="w-0.5 h-4 bg-brand-red rounded-full animate-pulse delay-75" />
                        <span className="w-0.5 h-2.5 bg-brand-rose rounded-full animate-pulse delay-150" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p
                      className={`truncate text-sm font-semibold transition-colors ${
                        isCurrent ? 'text-brand-coral' : 'text-white/95 group-hover:text-white'
                      }`}
                    >
                      {song.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-white/45 truncate">
                      <span
                        onClick={(e) => {
                          if (onNavigateArtist) {
                            e.stopPropagation();
                            onNavigateArtist(song.artist);
                          }
                        }}
                        className={
                          onNavigateArtist
                            ? 'hover:underline hover:text-brand-rose cursor-pointer'
                            : ''
                        }
                      >
                        {song.artist}
                      </span>
                      {song.album && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[160px] text-zinc-500">
                            {song.album}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Version + Like + Trash + Duration */}
                <div
                  className="flex items-center gap-3 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Version tag */}
                  <div className="hidden sm:block">
                    {song.currentVersion === 'radio' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-brand-red/20 text-brand-coral border border-brand-red/30 px-2 py-0.5 rounded-full font-medium">
                        <Radio className="w-2.5 h-2.5" /> Radio
                      </span>
                    ) : song.currentVersion === 'lyrics' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-medium">
                        <FileText className="w-2.5 h-2.5" /> Lyrics
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-medium">
                        <Film className="w-2.5 h-2.5" /> Original
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => toggleLikeSong(song)}
                    className={`p-2 rounded-lg transition-colors ${
                      isLiked
                        ? 'text-brand-coral'
                        : 'text-zinc-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100'
                    }`}
                    title={isLiked ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                  </button>

                  {playlist.isCustom && (
                    <button
                      onClick={() => removeSongFromPlaylist(playlist.id, song.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-white/10"
                      title="Eliminar de esta playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <span className="text-xs font-mono text-zinc-500">
                    {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Gallery Mode */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredSongs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              contextQueue={playlist.songs}
              onNavigateArtist={onNavigateArtist}
            />
          ))}
        </div>
      )}
    </div>
  );
};
