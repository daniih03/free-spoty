import React, { useState } from 'react';
import { Home, Search, Heart, History, Plus, DownloadCloud, Library, User as UserIcon, LogOut } from 'lucide-react';
import { useLikedSongs, usePlaylists } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import { ui } from '../../state/ui';
import type { Route, ViewType } from '../../hooks/useNavigation';
import { CreatePlaylistSheet } from '../UI/CreatePlaylistSheet';
import { Cover } from '../UI/Primitives';

interface SmartDockProps {
  route: Route;
  onNavigate: (view: ViewType, id?: string) => void;
}

/** Rail lateral flotante: 68 px, se despliega a 248 px al pasar el cursor (sin mover el contenido). */
export const SmartDock: React.FC<SmartDockProps> = ({ route, onNavigate }) => {
  const { user, profile, signOut } = useAuth();
  const playlists = usePlaylists();
  const likedCount = useLikedSongs().length;
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const navItems: { id: ViewType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'home', label: 'Inicio', icon: <Home className="w-5 h-5" /> },
    { id: 'search', label: 'Buscar', icon: <Search className="w-5 h-5" /> },
    { id: 'library', label: 'Tu biblioteca', icon: <Library className="w-5 h-5" /> },
    { id: 'liked', label: 'Me gusta', icon: <Heart className="w-5 h-5" />, count: likedCount },
    { id: 'history', label: 'Historial', icon: <History className="w-5 h-5" /> },
  ];

  const label = `whitespace-nowrap transition-[opacity,transform] duration-300 ease-out ${
    open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1 pointer-events-none'
  }`;

  return (
    <>
      <aside
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}
        className={`hidden md:flex flex-col fixed left-3 top-3 bottom-[112px] z-30 transition-[width] duration-300 ease-out select-none ${
          open ? 'w-[248px]' : 'w-[68px]'
        }`}
      >
        <div
          className={`h-full w-full rounded-[22px] border border-line flex flex-col p-2.5 overflow-hidden transition-[background-color,box-shadow] duration-300 ${
            open ? 'bg-raised/95 backdrop-blur-2xl shadow-[0_30px_60px_-20px_rgba(0,0,0,0.95)]' : 'bg-lacquer/70 backdrop-blur-xl'
          }`}
        >
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 h-12 px-1.5 rounded-xl text-left shrink-0"
            aria-label="Free-Spoty, inicio"
          >
            <img src="./logo.png" alt="" width={36} height={36} className="w-9 h-9 object-contain shrink-0" />
            <span className={`font-display text-[19px] font-bold tracking-tight text-paper ${label}`}>Free-Spoty</span>
          </button>

          <nav className="mt-4 space-y-1 shrink-0">
            {navItems.map((item) => {
              const active = route.view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={!open ? item.label : undefined}
                  aria-current={active ? 'page' : undefined}
                  className={`relative w-full flex items-center gap-3.5 h-11 px-3 rounded-xl transition-colors ${
                    active ? 'bg-paper/[0.08] text-paper' : 'text-mute hover:text-paper hover:bg-paper/[0.05]'
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-brand-red transition-all duration-300 ${
                      active ? 'h-5 opacity-100' : 'h-0 opacity-0'
                    }`}
                  />
                  <span className="shrink-0">{item.icon}</span>
                  <span className={`text-[14px] font-medium ${label}`}>{item.label}</span>
                  {!!item.count && (
                    <span className={`ml-auto text-[12px] text-faint tabular ${label}`}>{item.count}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Playlists: miniaturas en el rail, nombres al desplegar */}
          <div className="mt-5 pt-4 border-t border-line flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between h-8 px-1.5 shrink-0">
              <span className={`text-[13px] font-semibold text-mute ${label}`}>Tus playlists</span>
              <button
                onClick={() => setShowCreate(true)}
                className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-mute hover:text-paper hover:bg-paper/[0.07] transition-colors"
                title="Nueva playlist"
              >
                <Plus className="w-[18px] h-[18px]" />
              </button>
            </div>
            <div className="mt-1 overflow-y-auto overflow-x-hidden min-h-0 space-y-0.5 scrollbar-none">
              {playlists.map((pl) => {
                const active = route.view === 'playlist' && route.id === pl.id;
                return (
                  <button
                    key={pl.id}
                    onClick={() => onNavigate('playlist', pl.id)}
                    title={!open ? pl.name : undefined}
                    className={`w-full flex items-center gap-3 p-1.5 rounded-xl transition-colors ${
                      active ? 'bg-paper/[0.08]' : 'hover:bg-paper/[0.05]'
                    }`}
                  >
                    <Cover src={pl.coverUrl} size={80} alt="" className="w-9 h-9 rounded-md shrink-0" />
                    <span className={`min-w-0 text-left ${label}`}>
                      <span className={`block text-[13px] font-medium truncate ${active ? 'text-brand-coral' : 'text-paper'}`}>
                        {pl.name}
                      </span>
                      <span className="block text-[12px] text-faint">{pl.songs.length} canciones</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 space-y-1 shrink-0">
            <button
              onClick={ui.openImportExport}
              title={!open ? 'Importar y copias de seguridad' : undefined}
              className="w-full flex items-center gap-3.5 h-11 px-3 rounded-xl text-mute hover:text-paper hover:bg-paper/[0.05] transition-colors"
            >
              <DownloadCloud className="w-5 h-5 shrink-0" />
              <span className={`text-[14px] font-medium ${label}`}>Importar y copias</span>
            </button>

            {user ? (
              <div className="flex items-center gap-3 h-12 px-1.5 rounded-xl">
                <span className="w-9 h-9 shrink-0 rounded-full bg-brand-red text-paper flex items-center justify-center font-display font-bold uppercase">
                  {(profile?.displayName || user.email || 'U')[0]}
                </span>
                <span className={`min-w-0 flex-1 ${label}`}>
                  <span className="block text-[13px] font-semibold text-paper truncate">{profile?.displayName}</span>
                  <span className="block text-[12px] text-faint">Sincronizado</span>
                </span>
                <button
                  onClick={() => signOut()}
                  title="Cerrar sesión"
                  className={`p-2 rounded-lg text-mute hover:text-brand-rose transition-colors ${label}`}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => ui.openAuth('login')}
                title={!open ? 'Iniciar sesión' : undefined}
                className="w-full flex items-center gap-3.5 h-11 px-3 rounded-xl text-paper bg-brand-red/15 hover:bg-brand-red/25 transition-colors"
              >
                <UserIcon className="w-5 h-5 shrink-0 text-brand-coral" />
                <span className={`text-[14px] font-medium ${label}`}>Iniciar sesión</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {showCreate && <CreatePlaylistSheet onClose={() => setShowCreate(false)} onCreated={(id) => onNavigate('playlist', id)} />}
    </>
  );
};
