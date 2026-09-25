import React, { forwardRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Sliders, Shuffle, User as UserIcon, LogOut, X } from 'lucide-react';
import { usePlayer } from '../state/player';
import { ui } from '../state/ui';
import { useAuth } from '../context/AuthContext';

interface TopNavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  canGoBack: boolean;
  onGoBack: () => void;
  canGoForward: boolean;
  onGoForward: () => void;
}

export const TopNavbar = forwardRef<HTMLInputElement, TopNavbarProps>(function TopNavbar(
  { searchQuery, onSearchChange, canGoBack, onGoBack, canGoForward, onGoForward },
  searchRef
) {
  const isShuffle = usePlayer((s) => s.isShuffle);
  const { user, profile, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  // Estado local: la escritura no espera al router (sin lag al teclear)
  const [text, setText] = useState(searchQuery);

  useEffect(() => setText(searchQuery), [searchQuery]);

  const navBtn = (enabled: boolean) =>
    `w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
      enabled
        ? 'bg-neutral-800/90 hover:bg-neutral-700 text-white border border-white/15 hover:border-white/30 shadow-md shadow-black/40 hover:scale-105 active:scale-95'
        : 'bg-black/40 text-zinc-600 border border-white/5 opacity-40 cursor-not-allowed'
    }`;

  const update = (q: string) => {
    setText(q);
    onSearchChange(q);
  };

  return (
    <header className="w-full min-w-0 h-[calc(56px+env(safe-area-inset-top,0px))] md:h-16 pt-[env(safe-area-inset-top,0px)] px-2.5 sm:px-3 md:px-6 flex items-center justify-between gap-2 sm:gap-2.5 md:gap-4 z-20 select-none">
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <button onClick={onGoBack} disabled={!canGoBack} className={navBtn(canGoBack)} title="Atrás" aria-label="Página anterior">
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
        </button>
        <button onClick={onGoForward} disabled={!canGoForward} className={navBtn(canGoForward)} title="Adelante" aria-label="Página siguiente">
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
        </button>
      </div>

      <div className="flex-1 min-w-0 max-w-md relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={searchRef}
          type="search"
          enterKeyHint="search"
          value={text}
          onChange={(e) => update(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && (e.currentTarget as HTMLInputElement).blur()}
          placeholder="Buscar canciones o artistas..."
          aria-label="Buscar"
          className="w-full pl-8 sm:pl-9 pr-8 sm:pr-12 py-1.5 sm:py-2 rounded-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/10 focus:border-brand-coral/60 focus:ring-1 focus:ring-brand-coral/30 text-xs text-white placeholder-zinc-400 outline-none transition-all shadow-inner [&::-webkit-search-cancel-button]:hidden"
        />
        {text ? (
          <button
            onClick={() => update('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-white"
            aria-label="Borrar búsqueda"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex text-[10px] text-zinc-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-md font-mono">
            /
          </kbd>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
        {isShuffle && (
          <div
            className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/25 text-brand-rose text-xs font-medium"
            title="True Shuffle activado: distribución 100% equiprobable"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>True Shuffle</span>
          </div>
        )}

        <button
          onClick={ui.openEqualizer}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 hover:text-white transition-colors"
          title="Ecualizador y ajustes"
        >
          <Sliders className="w-4 h-4" />
        </button>

        <div className="relative">
          {user ? (
            <>
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-medium transition-all"
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
              >
                <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-brand-crimson to-brand-coral flex items-center justify-center text-[10px] font-bold text-white uppercase">
                  {(profile?.displayName || user.email || 'U')[0]}
                </span>
                <span className="hidden sm:inline max-w-[90px] truncate">{profile?.displayName}</span>
              </button>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-[#15151c]/95 border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl z-50 animate-fadeIn" role="menu">
                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <p className="text-xs font-semibold text-white truncate">{profile?.displayName || 'Usuario'}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        void signOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <button
              onClick={() => ui.openAuth('login')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-brand-crimson via-brand-red to-brand-coral hover:brightness-110 text-white text-xs font-semibold shadow-md shadow-brand-red/20 transition-all active:scale-95"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
});
