import React, { useState } from 'react';
import { Home, Search, Heart, History, Plus, Music, DownloadCloud, Trash2, Library, User as UserIcon, LogOut } from 'lucide-react';
import { deleteCustomPlaylist, useLikedSongs, usePlaylists } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import { ui } from '../../state/ui';
import type { Route, ViewType } from '../../hooks/useNavigation';
import { CreatePlaylistSheet } from '../UI/CreatePlaylistSheet';

interface SmartDockProps {
  route: Route;
  onNavigate: (view: ViewType, id?: string) => void;
}

/** Rail flotante retráctil (68 px → 240 px al pasar el cursor), sin layout shift. */
export const SmartDock: React.FC<SmartDockProps> = ({ route, onNavigate }) => {
  const { user, profile, signOut } = useAuth();
  const playlists = usePlaylists();
  const likedCount = useLikedSongs().length;
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const navItems: { id: ViewType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'home', label: 'Inicio', icon: <Home className="w-5 h-5" /> },
    { id: 'search', label: 'Explorar', icon: <Search className="w-5 h-5" /> },
    { id: 'library', label: 'Biblioteca', icon: <Library className="w-5 h-5" /> },
    { id: 'liked', label: 'Me Gusta', icon: <Heart className="w-5 h-5" />, count: likedCount },
    { id: 'history', label: 'Historial', icon: <History className="w-5 h-5" /> },
  ];

  const reveal = `transition-all duration-300 whitespace-nowrap ${
    isExpanded ? 'opacity-100 max-w-[140px]' : 'opacity-0 max-w-0 overflow-hidden pointer-events-none'
  }`;

  return (
    <>
      <aside
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        onFocus={() => setIsExpanded(true)}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setIsExpanded(false)}
        className={`hidden md:flex flex-col fixed left-4 top-4 bottom-28 z-30 transition-[width] duration-300 ease-out select-none ${
          isExpanded ? 'w-60 shadow-2xl shadow-black/80' : 'w-[68px]'
        }`}
      >
        <div className="h-full w-full rounded-3xl bg-[#121217]/85 backdrop-blur-2xl border border-white/[0.08] flex flex-col justify-between p-3.5 overflow-hidden shadow-2xl">
          <div className="flex flex-col min-h-0">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-3 p-1.5 rounded-2xl group hover:bg-white/5 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-2xl bg-brand-surface flex items-center justify-center flex-shrink-0 shadow-lg border border-white/10 group-hover:scale-105 transition-transform">
                <img src="./logo.png" alt="Free-Spoty" width={32} height={32} className="w-8 h-8 object-contain" />
              </div>
              <div className={reveal}>
                <h1 className="text-sm font-extrabold tracking-tight text-white">
                  Free<span className="text-brand-coral">Spoty</span>
                </h1>
                <p className="text-[10px] text-zinc-400 font-medium">Studio Clean Audio</p>
              </div>
            </button>

            <div className="h-px bg-white/[0.06] my-3" />

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = route.view === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={!isExpanded ? item.label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center gap-3.5 p-2.5 rounded-2xl transition-all relative group ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-crimson/30 to-brand-red/15 text-white font-semibold border border-brand-red/40 shadow-lg shadow-brand-red/10'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <span className={`flex items-center justify-center transition-transform duration-200 ${isActive ? 'text-brand-coral scale-110' : 'group-hover:scale-105'}`}>
                      {item.icon}
                    </span>
                    <span className={`text-xs tracking-tight ${reveal}`}>{item.label}</span>
                    {!!item.count && isExpanded && (
                      <span className="ml-auto text-[10px] bg-white/10 text-zinc-300 px-1.5 py-0.5 rounded-full font-mono">{item.count}</span>
                    )}
                    {isActive && !isExpanded && (
                      <span className="absolute right-1 w-1.5 h-1.5 rounded-full bg-brand-coral shadow-[0_0_8px_#ff3b24]" />
                    )}
                  </button>
                );
              })}
            </nav>

            {isExpanded && (
              <div className="mt-4 pt-2 border-t border-white/[0.06] animate-fadeIn min-h-0 flex flex-col">
                <div className="flex items-center justify-between px-1 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                    <Music className="w-3 h-3 text-brand-coral" /> Listas
                  </span>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    title="Nueva playlist"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="overflow-y-auto space-y-0.5 px-1 min-h-0">
                  {playlists.map((pl) => (
                    <div
                      key={pl.id}
                      onClick={() => onNavigate('playlist', pl.id)}
                      className={`group flex items-center justify-between py-1.5 px-2 rounded-xl text-xs cursor-pointer ${
                        route.view === 'playlist' && route.id === pl.id
                          ? 'text-brand-coral bg-white/5'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="truncate">{pl.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`¿Eliminar "${pl.name}"?`)) deleteCustomPlaylist(pl.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-500 hover:text-red-400"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-2 pt-2">
            <button
              onClick={ui.openImportExport}
              title={!isExpanded ? 'Importar y copias de seguridad' : undefined}
              className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors group"
            >
              <DownloadCloud className="w-5 h-5 group-hover:scale-105 text-brand-coral flex-shrink-0" />
              <span className={reveal}>Copias & Backup</span>
            </button>

            {user ? (
              <div
                title={!isExpanded ? profile?.displayName || user.email || 'Mi perfil' : undefined}
                className="w-full flex items-center justify-between p-2 rounded-2xl bg-white/5 border border-white/5 text-xs text-white"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-crimson to-brand-coral flex items-center justify-center text-[11px] font-bold text-white uppercase flex-shrink-0">
                    {(profile?.displayName || user.email || 'U')[0]}
                  </div>
                  <div className={reveal}>
                    <p className="font-semibold truncate text-[11px] text-white max-w-[110px]">{profile?.displayName}</p>
                    <p className="text-[9px] text-zinc-400">Sincronizado</p>
                  </div>
                </div>
                {isExpanded && (
                  <button
                    onClick={() => signOut()}
                    title="Cerrar sesión"
                    className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => ui.openAuth('login')}
                title={!isExpanded ? 'Iniciar sesión / Registrarse' : undefined}
                className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-xs font-semibold bg-gradient-to-r from-brand-red/20 to-brand-coral/10 border border-brand-red/25 text-white hover:from-brand-red/30 hover:to-brand-coral/20 transition-all group"
              >
                <UserIcon className="w-5 h-5 text-brand-coral group-hover:scale-105 flex-shrink-0" />
                <span className={reveal}>Iniciar sesión</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {showCreate && <CreatePlaylistSheet onClose={() => setShowCreate(false)} onCreated={(id) => onNavigate('playlist', id)} />}
    </>
  );
};
