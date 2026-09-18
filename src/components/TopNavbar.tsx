import React, { useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Sliders,
  Shuffle,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

interface TopNavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenEqualizer: () => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenEqualizer,
  canGoBack = false,
  onGoBack,
}) => {
  const { isShuffle, activeVersion } = usePlayer();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <header className="h-16 px-6 flex items-center justify-between gap-4 z-10 select-none bg-transparent">
      {/* Navigation history arrows */}
      <div className="flex items-center gap-2">
        <button
          onClick={onGoBack}
          disabled={!canGoBack}
          className="p-2 rounded-full bg-black/40 border border-white/5 hover:bg-black/60 text-zinc-300 disabled:opacity-30 disabled:hover:bg-black/40 transition-colors"
          title="Atrás"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          disabled
          className="p-2 rounded-full bg-black/40 border border-white/5 text-zinc-600 cursor-not-allowed hidden sm:block"
          title="Adelante"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Global Search Bar with `/` shortcut */}
      <div className="flex-1 max-w-md relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="¿Qué quieres escuchar hoy? (Canciones, artistas, álbumes...)"
          className="w-full pl-10 pr-12 py-2 rounded-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/10 focus:border-brand-green/60 text-xs text-white placeholder-zinc-400 outline-none transition-all shadow-inner"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center gap-0.5 text-[10px] text-zinc-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-md font-mono">
          <span>/</span>
        </div>
      </div>

      {/* System Badges & Settings */}
      <div className="flex items-center gap-3">

        {/* True Shuffle Badge */}
        {isShuffle && (
          <div
            className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium"
            title="True Shuffle Activado: Distribución 100% equiprobable sin sesgo"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>True Shuffle</span>
          </div>
        )}

        {/* Equalizer Quick Button */}
        <button
          onClick={onOpenEqualizer}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 hover:text-white transition-colors"
          title="Ecualizador y Ajustes"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
