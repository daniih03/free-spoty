import React, { useState } from 'react';
import { Song } from '../../types/music';
import { usePlayer } from '../../context/PlayerContext';
import { isSongLiked, toggleLikeSong, getCustomPlaylists, addSongToPlaylist } from '../../services/storageService';
import { Play, Pause, Heart, MoreVertical, Plus, Radio, FileText, Film, Sparkles } from 'lucide-react';

interface SongCardProps {
  song: Song;
  contextQueue?: Song[];
  index?: number;
}

export const SongCard: React.FC<SongCardProps> = ({ song, contextQueue }) => {
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

  const getVersionBadge = () => {
    if (song.currentVersion === 'radio') {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-medium">
          <Sparkles className="w-2.5 h-2.5" /> YT Music
        </span>
      );
    }
    if (song.currentVersion === 'lyrics') {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded-full font-medium">
          <FileText className="w-2.5 h-2.5" /> Lyrics
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full font-medium">
        <Film className="w-2.5 h-2.5" /> Original
      </span>
    );
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all duration-200 cursor-pointer border border-white/[0.06] hover:border-white/20 hover:shadow-xl hover:-translate-y-1 transform-gpu ${
        isCurrent ? 'bg-white/[0.08] border-brand-green/40 shadow-lg shadow-brand-green/5' : ''
      }`}
    >
      {/* Cover with Play Overlay */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 shadow-md bg-white/5">
        <img
          src={song.coverUrl}
          alt={song.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 transform-gpu"
        />

        {/* Play Button Overlay */}
        <div
          className={`absolute bottom-2 right-2 transition-all duration-200 ${
            isCurrent
              ? 'opacity-100 translate-y-0'
              : 'opacity-90 md:opacity-0 translate-y-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0'
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="w-10 h-10 rounded-full bg-brand-green text-black flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform"
            title={isCurrent && isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Heart Favorite */}
        <button
          onClick={handleLike}
          className={`absolute top-2 left-2 p-1.5 rounded-full bg-black/40 backdrop-blur-sm transition-opacity ${
            isLiked
              ? 'text-brand-green opacity-100'
              : 'text-white/70 hover:text-white opacity-0 group-hover:opacity-100'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Title & Artist */}
      <div className="space-y-1">
        <h4
          className={`text-sm font-semibold truncate transition-colors ${
            isCurrent ? 'text-brand-green' : 'text-white group-hover:text-white'
          }`}
        >
          {song.title}
        </h4>
        <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
      </div>

      {/* Version Badge & Actions */}
      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between">
        {getVersionBadge()}

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 bottom-full mb-1 w-48 bg-[#202020] border border-white/10 rounded-xl shadow-2xl py-1 z-50 text-xs text-zinc-200 animate-fadeIn"
            >
              <button
                onClick={() => {
                  playNextInQueue(song);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 text-brand-green" /> Reproducir siguiente
              </button>

              <button
                onClick={() => {
                  addToQueue(song);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" /> Añadir al final de la cola
              </button>

              {customPlaylists.length > 0 && (
                <div className="border-t border-white/10 my-1 pt-1">
                  <div className="px-3 py-1 text-[10px] text-zinc-400 font-semibold uppercase">
                    Añadir a playlist:
                  </div>
                  {customPlaylists.map((pl) => (
                    <button
                      key={pl.id}
                      onClick={() => {
                        addSongToPlaylist(pl.id, song);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-white/10 text-xs truncate"
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
