import React, { useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Sliders,
  Shuffle,
  User as UserIcon,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';

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
  const { isShuffle } = usePlayer();
  const { user, profile, openAuthModal, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
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
          className="w-full pl-10 pr-12 py-2 rounded-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/10 focus:border-brand-coral/60 focus:ring-1 focus:ring-brand-coral/30 text-xs text-white placeholder-zinc-400 outline-none transition-all shadow-inner"
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

        {/* User Profile / Iniciar Sesión */}
        <div className="relative">
          {user ? (
            <div>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-medium transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-brand-crimson to-brand-coral flex items-center justify-center text-[10px] font-bold text-white uppercase">
                  {(profile?.displayName || user.email || 'U')[0]}
                </div>
                <span className="hidden sm:inline max-w-[90px] truncate">
                  {profile?.displayName || user.email?.split('@')[0]}
                </span>
              </button>

              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-neutral-900/95 border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl z-50 animate-fade-in"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div className="px-3 py-2 border-b border-white/5 mb-1">
                    <p className="text-xs font-semibold text-white truncate">
                      {profile?.displayName || 'Usuario'}
                    </p>
                    <p className="text-[10px] text-neutral-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-semibold shadow-md shadow-red-600/20 transition-all transform active:scale-95"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
