import React, { forwardRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, User as UserIcon, LogOut, X } from 'lucide-react';
import { ui } from '../state/ui';
import { useAuth } from '../context/AuthContext';

interface TopNavbarProps {
  /** El contenido se ha desplazado: la barra gana fondo para no pisar el texto. */
  scrolled?: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  canGoBack: boolean;
  onGoBack: () => void;
  canGoForward: boolean;
  onGoForward: () => void;
}

export const TopNavbar = forwardRef<HTMLInputElement, TopNavbarProps>(function TopNavbar(
  { scrolled = false, searchQuery, onSearchChange, canGoBack, onGoBack, canGoForward, onGoForward },
  searchRef
) {
  const { user, profile, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  // Estado local: la escritura no espera al router (sin lag al teclear)
  const [text, setText] = useState(searchQuery);

  useEffect(() => setText(searchQuery), [searchQuery]);

  const navBtn = (enabled: boolean) =>
    `w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
      enabled ? 'bg-ink/60 text-paper hover:bg-paper/10' : 'bg-ink/30 text-faint cursor-not-allowed'
    }`;

  const update = (q: string) => {
    setText(q);
    onSearchChange(q);
  };

  return (
    <header
      className={`w-full min-w-0 h-[calc(60px+env(safe-area-inset-top,0px))] md:h-[72px] pt-[env(safe-area-inset-top,0px)] px-3 sm:px-6 md:px-10 flex items-center gap-2 sm:gap-3 select-none transition-[background-color,box-shadow] duration-300 ${
        scrolled ? 'bg-ink/85 backdrop-blur-xl shadow-[0_1px_0_rgba(244,236,231,0.06)]' : 'bg-transparent'
      }`}
    >
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <button onClick={onGoBack} disabled={!canGoBack} className={navBtn(canGoBack)} title="Atrás" aria-label="Atrás">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={onGoForward} disabled={!canGoForward} className={navBtn(canGoForward)} title="Adelante" aria-label="Adelante">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      {canGoBack && (
        <button onClick={onGoBack} className={`sm:hidden shrink-0 ${navBtn(true)}`} aria-label="Atrás">
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      <div className="flex-1 min-w-0 max-w-[480px] relative group">
        <Search className="w-[18px] h-[18px] text-mute group-focus-within:text-paper absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
        <input
          ref={searchRef}
          type="search"
          enterKeyHint="search"
          value={text}
          onChange={(e) => update(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && (e.currentTarget as HTMLInputElement).blur()}
          placeholder={typeof window !== 'undefined' && window.innerWidth < 640 ? 'Buscar' : '¿Qué quieres escuchar?'}
          aria-label="Buscar"
          className="w-full h-11 pl-11 pr-10 rounded-full bg-paper/[0.07] hover:bg-paper/[0.1] focus:bg-paper/[0.1] border border-transparent focus:border-paper/25 text-[14px] text-paper placeholder-mute outline-none transition-colors [&::-webkit-search-cancel-button]:hidden"
        />
        {text ? (
          <button
            onClick={() => update('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-mute hover:text-paper"
            aria-label="Borrar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none hidden md:flex text-[11px] text-faint border border-line px-1.5 rounded font-sans">
            /
          </kbd>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <button
          onClick={ui.openEqualizer}
          className="w-10 h-10 rounded-full flex items-center justify-center text-mute hover:text-paper hover:bg-paper/[0.07] transition-colors"
          title="Sonido y ajustes"
          aria-label="Sonido y ajustes"
        >
          <SlidersHorizontal className="w-[18px] h-[18px]" />
        </button>

        <div className="relative">
          {user ? (
            <>
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                className="w-10 h-10 rounded-full bg-brand-red text-paper font-display font-bold uppercase flex items-center justify-center ring-4 ring-ink/60 hover:scale-105 transition-transform"
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
                title={profile?.displayName}
              >
                {(profile?.displayName || user.email || 'U')[0]}
              </button>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div
                    className="absolute right-0 mt-2 w-60 bg-raised border border-line rounded-xl p-1.5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.9)] z-50 origin-top-right animate-scale-up"
                    role="menu"
                  >
                    <div className="px-3 py-2.5">
                      <p className="text-[14px] font-semibold text-paper truncate">{profile?.displayName || 'Tu cuenta'}</p>
                      <p className="text-[12px] text-mute truncate">{user.email}</p>
                    </div>
                    <div className="h-px bg-line mx-2 my-1" />
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        void signOut();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-paper/90 hover:bg-paper/[0.07] rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-mute" />
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <button
              onClick={() => ui.openAuth('login')}
              className="flex items-center gap-2 h-9 sm:h-10 px-3.5 sm:px-4 rounded-full bg-paper text-ink text-[13px] sm:text-[14px] font-semibold hover:scale-[1.03] active:scale-95 transition-transform"
            >
              <UserIcon className="w-4 h-4 hidden sm:block" />
              Entrar
            </button>
          )}
        </div>
      </div>
    </header>
  );
});
