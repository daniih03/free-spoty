import React, { useEffect, useRef } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { VersionSelector } from './VersionSelector';
import { X, Mic2, Music, Sparkles } from 'lucide-react';

interface LyricsViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LyricsView: React.FC<LyricsViewProps> = ({ isOpen, onClose }) => {
  const { currentSong, currentTime, seek, syncedLyrics, isLoadingLyrics } = usePlayer();
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Determine current active lyric line index
  let activeIndex = -1;
  if (syncedLyrics && syncedLyrics.length > 0) {
    for (let i = 0; i < syncedLyrics.length; i++) {
      if (currentTime >= syncedLyrics[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }
  }

  // Smooth auto-scroll to active line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  if (!isOpen || !currentSong) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-2xl text-white transition-all duration-500 animate-fadeIn">
      {/* Top action bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/10 text-brand-green">
            <Mic2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-zinc-400 flex items-center gap-2">
              Letras Sincronizadas (Karaoke)
              <Sparkles className="w-3.5 h-3.5 text-brand-green" />
            </h2>
            <p className="text-xs text-zinc-500">Haz clic en cualquier verso para saltar directamente a ese momento</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <VersionSelector compact />
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors"
            title="Cerrar vista de letras (ESC o F)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main split content: Album art on left, Lyrics on right */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden max-w-7xl mx-auto w-full p-6 gap-8 items-center">
        {/* Left: Vinyl/cover presentation (compact on mobile, big on desktop) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-2 md:p-4 text-center">
          <div className="relative group w-32 h-32 md:w-80 md:h-80 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-white/15">
            <img
              src={currentSong.coverUrl}
              alt={currentSong.title}
              className="w-full h-full object-cover rounded-2xl md:rounded-3xl transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
          </div>

          <div className="mt-3 md:mt-6">
            <h1 className="text-xl md:text-3xl font-bold tracking-tight text-white mb-1 md:mb-2 truncate max-w-xs md:max-w-none">
              {currentSong.title}
            </h1>
            <p className="text-sm md:text-lg text-zinc-400 font-medium truncate max-w-xs md:max-w-none">
              {currentSong.artist}
            </p>
          </div>
        </div>

        {/* Right: Synced karaoke lyrics scroll area */}
        <div
          ref={containerRef}
          className="md:col-span-7 h-[65vh] overflow-y-auto pr-4 space-y-6 scrollbar-none select-none text-left py-20"
          style={{ scrollBehavior: 'smooth' }}
        >
          {isLoadingLyrics ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-3">
              <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Buscando letra sincronizada...</p>
            </div>
          ) : syncedLyrics && syncedLyrics.length > 0 ? (
            syncedLyrics.map((line, idx) => {
              const isActive = idx === activeIndex;
              const isPast = idx < activeIndex;

              return (
                <div
                  key={`${line.time}-${idx}`}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => seek(line.time)}
                  className={`group cursor-pointer transition-all duration-300 rounded-2xl px-4 py-2 ${
                    isActive
                      ? 'text-white text-2xl md:text-3xl font-extrabold scale-[1.02] bg-white/10 shadow-lg border-l-4 border-brand-green pl-6'
                      : isPast
                      ? 'text-zinc-500 text-lg md:text-xl font-semibold opacity-60 hover:opacity-100 hover:text-zinc-300'
                      : 'text-zinc-400 text-lg md:text-xl font-semibold opacity-80 hover:opacity-100 hover:text-white'
                  }`}
                >
                  <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
                    {line.text}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
              <Music className="w-12 h-12 opacity-40 text-brand-green" />
              <p className="text-lg font-medium">Letra instrumental o no disponible para este tema</p>
              <p className="text-xs text-zinc-600 max-w-sm text-center">
                Disfruta de la música en alta fidelidad con tu ecualizador y audio limpio.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
