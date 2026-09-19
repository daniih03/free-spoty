import React, { useState } from 'react';
import { Song } from '../../types/music';
import { usePlayer } from '../../context/PlayerContext';
import { isSongLiked, toggleLikeSong, getCustomPlaylists, addSongToPlaylist } from '../../services/storageService';
import { Play, Pause, Heart, MoreVertical, Plus, Disc3 } from 'lucide-react';

interface SongCardProps {
  song: Song;
  contextQueue?: Song[];
  index?: number;
  onNavigateArtist?: (artistName: string) => void;
}

export const SongCard: React.FC<SongCardProps> = ({ song, contextQueue, onNavigateArtist }) => {
  const { currentSong, isPlaying, playSong, togglePlay, playNextInQueue, addToQueue } = usePlayer();
  const [showMenu, setShowMenu] = useState(false);

  const isCurrent = currentSong?.id === song.id;
  const isLiked = isSongLiked(song.id);
  const customPlaylists = getCustomPlaylists();

  const handleCardClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song, contextQueue);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLikeSong(song);
  };



  return (
    <div
      onClick={handleCardClick}
      className={`group relative p-3 rounded-2xl md:rounded-[22px] backdrop-blur-xl transition-all duration-300 cursor-pointer border transform-gpu hover:-translate-y-1 ${
        isCurrent
          ? 'bg-brand-burgundy/25 border-brand-red/50 shadow-[0_8px_30px_rgba(200,25,0,0.2)]'
          : 'bg-[#13141f]/50 hover:bg-[#1b1c2b]/75 border-white/[0.06] hover:border-brand-red/35 shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_32px_rgba(200,25,0,0.12)]'
      }`}
    >
      {/* Cover with Play Overlay & Aura glow */}
      <div className="relative aspect-square w-full rounded-xl md:rounded-[16px] overflow-hidden mb-3 shadow-md bg-white/[0.03]">
        <img
          src={song.coverUrl}
          alt={song.title}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
          }}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 transform-gpu bg-zinc-900"
        />

        {/* Dynamic Soundwave indicator when actively playing */}
        {isCurrent && isPlaying && (
          <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-brand-red/30 flex items-center gap-0.5 z-10">
            <span className="w-0.5 h-3 bg-brand-coral rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
            <span className="w-0.5 h-4 bg-brand-red rounded-full animate-[pulse_0.4s_ease-in-out_infinite_0.15s]" />
            <span className="w-0.5 h-2.5 bg-brand-rose rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.3s]" />
          </div>
        )}

        {/* Favorite Heart (Top Left) */}
        <button
          onClick={handleLike}
          className={`absolute top-2.5 left-2.5 p-2 rounded-full backdrop-blur-md transition-all z-10 ${
            isLiked
              ? 'bg-black/50 text-brand-coral opacity-100 shadow-sm'
              : 'bg-black/30 text-white/70 hover:text-white hover:bg-black/60 opacity-0 group-hover:opacity-100'
          }`}
          title={isLiked ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
        </button>

        {/* Floating Play Capsule Button (Bottom Right) */}
        <div
          className={`absolute bottom-2.5 right-2.5 transition-all duration-300 z-10 ${
            isCurrent
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-2 scale-90 md:group-hover:opacity-100 md:group-hover:translate-y-0 md:group-hover:scale-100'
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-crimson via-brand-red to-brand-coral text-white flex items-center justify-center shadow-lg shadow-brand-red/40 hover:scale-110 active:scale-95 transition-all"
            title={isCurrent && isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Title & Artist & Menu */}
      <div className="flex items-start justify-between gap-1.5 px-0.5">
        <div className="min-w-0 flex-1 space-y-0.5">
          <h4
            className={`text-sm font-medium tracking-tight truncate transition-colors ${
              isCurrent ? 'text-brand-coral font-semibold' : 'text-white/95 group-hover:text-white'
            }`}
          >
            {song.title}
          </h4>
          <p
            onClick={(e) => {
              if (onNavigateArtist) {
                e.stopPropagation();
                onNavigateArtist(song.artist);
              }
            }}
            className={`text-xs text-white/45 truncate transition-colors ${
              onNavigateArtist
                ? 'hover:underline hover:text-brand-rose cursor-pointer'
                : 'hover:text-white/70'
            }`}
          >
            {song.artist}
          </p>
        </div>

        {/* Context Menu Trigger */}
        <div className="relative shrink-0 -mr-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
            title="Más opciones"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 bottom-full mb-1.5 w-48 bg-[#161722]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-1.5 z-50 text-xs text-zinc-200 animate-fadeIn"
            >
              {onNavigateArtist && (
                <button
                  onClick={() => {
                    onNavigateArtist(song.artist);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-white/10 flex items-center gap-2.5 text-white/90 transition-colors"
                >
                  <Disc3 className="w-3.5 h-3.5 text-brand-coral" /> Ver artista
                </button>
              )}

              <button
                onClick={() => {
                  playNextInQueue(song);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-white/10 flex items-center gap-2.5 text-white/90 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-brand-coral" /> Reproducir siguiente
              </button>

              <button
                onClick={() => {
                  addToQueue(song);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-white/10 flex items-center gap-2.5 text-white/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-zinc-400" /> Añadir al final de la cola
              </button>

              {customPlaylists.length > 0 && (
                <div className="border-t border-white/10 my-1 pt-1">
                  <div className="px-3.5 py-1 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                    Añadir a playlist:
                  </div>
                  {customPlaylists.map((pl) => (
                    <button
                      key={pl.id}
                      onClick={() => {
                        addSongToPlaylist(pl.id, song);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3.5 py-1.5 hover:bg-white/10 text-xs text-white/80 hover:text-white truncate transition-colors"
                    >
                      {pl.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
