import React, { useState, useEffect } from 'react';
import {
  Home,
  Search,
  Heart,
  History,
  Plus,
  Music,
  DownloadCloud,
  Trash2,
  Library,
  Sparkles,
} from 'lucide-react';
import {
  getCustomPlaylists,
  saveCustomPlaylist,
  deleteCustomPlaylist,
  getLikedSongs,
} from '../../services/storageService';
import { Playlist } from '../../types/music';

interface SmartDockProps {
  currentView: string;
  onNavigate: (view: string, playlistId?: string) => void;
  onOpenImportExport: () => void;
}

export const SmartDock: React.FC<SmartDockProps> = ({
  currentView,
  onNavigate,
  onOpenImportExport,
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedCount, setLikedCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const refreshPlaylists = () => {
    setPlaylists(getCustomPlaylists());
    setLikedCount(getLikedSongs().length);
  };

  useEffect(() => {
    refreshPlaylists();
    window.addEventListener('free_spoty_storage_change', refreshPlaylists);
    return () => window.removeEventListener('free_spoty_storage_change', refreshPlaylists);
  }, []);

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const created = saveCustomPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setShowCreateModal(false);
    onNavigate('playlist', created.id);
  };

  const handleDeletePlaylist = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('¿Eliminar esta playlist?')) {
      deleteCustomPlaylist(id);
    }
  };

  const navItems = [
    { id: 'home', label: 'Inicio', icon: <Home className="w-5 h-5" /> },
    { id: 'search', label: 'Explorar', icon: <Search className="w-5 h-5" /> },
    { id: 'library', label: 'Biblioteca', icon: <Library className="w-5 h-5" /> },
    { id: 'liked', label: 'Me Gusta', icon: <Heart className="w-5 h-5" />, count: likedCount },
    { id: 'history', label: 'Historial', icon: <History className="w-5 h-5" /> },
  ];

  return (
    <>
      <aside
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={`hidden md:flex flex-col fixed left-4 top-4 bottom-24 z-30 transition-all duration-300 ease-out select-none ${
          isExpanded ? 'w-60 shadow-2xl shadow-black/80' : 'w-[68px]'
        }`}
      >
        <div className="h-full w-full rounded-3xl bg-[#121217]/85 backdrop-blur-2xl border border-white/[0.08] flex flex-col justify-between p-3.5 overflow-hidden shadow-2xl">
          {/* Brand Icon Header */}
          <div className="flex flex-col">
            <div
              onClick={() => onNavigate('home')}
              className="flex items-center gap-3 p-1.5 rounded-2xl cursor-pointer group hover:bg-white/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#1a1a1a] flex items-center justify-center flex-shrink-0 shadow-lg border border-white/10 group-hover:scale-105 transition-transform">
                <img src="./logo.png" alt="Logo" className="w-8 h-8 object-contain" />
              </div>
              <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 max-w-[140px]' : 'opacity-0 max-w-0 pointer-events-none'}`}>
                <h1 className="text-sm font-extrabold tracking-tight text-white whitespace-nowrap">
                  Free<span className="text-brand-coral">Spoty</span>
                </h1>
                <p className="text-[10px] text-zinc-400 font-medium whitespace-nowrap">Studio Clean Audio</p>
              </div>
            </div>

            <div className="h-px bg-white/[0.06] my-3" />

            {/* Primary Navigation Items */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={!isExpanded ? item.label : undefined}
                    className={`w-full flex items-center gap-3.5 p-2.5 rounded-2xl transition-all relative group ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-crimson/30 to-brand-red/15 text-white font-semibold border border-brand-red/40 shadow-lg shadow-brand-red/10'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className={`flex items-center justify-center transition-transform duration-200 ${isActive ? 'text-brand-coral scale-110' : 'group-hover:scale-105'}`}>
                      {item.icon}
                    </div>

                    <span className={`text-xs tracking-tight whitespace-nowrap transition-all duration-300 ${isExpanded ? 'opacity-100 max-w-[120px]' : 'opacity-0 max-w-0 overflow-hidden'}`}>
                      {item.label}
                    </span>

                    {item.count !== undefined && item.count > 0 && isExpanded && (
                      <span className="ml-auto text-[10px] bg-white/10 text-zinc-300 px-1.5 py-0.5 rounded-full font-mono">
                        {item.count}
                      </span>
                    )}

                    {/* Active glow pip on collapsed state */}
                    {isActive && !isExpanded && (
                      <span className="absolute right-1 w-1.5 h-1.5 rounded-full bg-brand-coral shadow-[0_0_8px_#ff3b24]" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Area: Playlists & Tools */}
          <div className="flex flex-col space-y-2">
            {isExpanded && (
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between px-1 animate-fadeIn">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                  <Music className="w-3 h-3 text-brand-coral" /> Listas
                </span>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                  title="Nueva playlist"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Quick Playlist List (when expanded) */}
            {isExpanded && playlists.length > 0 && (
              <div className="max-h-36 overflow-y-auto space-y-0.5 scrollbar-thin px-1">
                {playlists.slice(0, 5).map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => onNavigate('playlist', pl.id)}
                    className="group flex items-center justify-between py-1.5 px-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer truncate"
                  >
                    <span className="truncate">{pl.name}</span>
                    <button
                      onClick={(e) => handleDeletePlaylist(e, pl.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={onOpenImportExport}
              title={!isExpanded ? 'Copia de seguridad e importación' : undefined}
              className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors group"
            >
              <DownloadCloud className="w-5 h-5 group-hover:scale-105 text-brand-coral flex-shrink-0" />
              <span className={`whitespace-nowrap transition-all duration-300 ${isExpanded ? 'opacity-100 max-w-[120px]' : 'opacity-0 max-w-0 overflow-hidden'}`}>
                Copias & Backup
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Quick Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <form
            onSubmit={handleCreatePlaylist}
            className="w-full max-w-sm bg-[#18181e] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white">Nueva Colección</h3>
            <input
              type="text"
              autoFocus
              placeholder="Título de la lista..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-black/50 border border-white/15 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-brand-coral"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!newPlaylistName.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-crimson to-brand-red text-white font-semibold text-xs disabled:opacity-50 shadow-lg shadow-brand-red/25"
              >
                Crear
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
