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
  Sparkles,
  Radio,
} from 'lucide-react';
import {
  getCustomPlaylists,
  saveCustomPlaylist,
  deleteCustomPlaylist,
  getLikedSongs,
} from '../services/storageService';
import { Playlist } from '../types/music';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string, playlistId?: string) => void;
  onOpenImportExport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onOpenImportExport,
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedCount, setLikedCount] = useState(0);
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

  return (
    <aside className="hidden md:flex w-64 bg-[#0a0a0c]/90 backdrop-blur-xl border-r border-white/5 flex-col h-full select-none z-20 flex-shrink-0">
      {/* Brand Header */}
      <div className="p-6 pb-4">
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-green to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Radio className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1">
              Free<span className="text-brand-green font-normal">Spoty</span>
            </h1>
            <span className="text-[10px] text-zinc-400 font-medium tracking-wide">
              Audio Limpio · Sin Anuncios
            </span>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="px-3 space-y-1">
        <button
          onClick={() => onNavigate('home')}
          className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            currentView === 'home'
              ? 'bg-white/10 text-white font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Home className="w-4 h-4" />
          Inicio
        </button>

        <button
          onClick={() => onNavigate('search')}
          className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            currentView === 'search'
              ? 'bg-white/10 text-white font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Search className="w-4 h-4" />
          Buscar
        </button>

        <button
          onClick={() => onNavigate('liked')}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            currentView === 'liked'
              ? 'bg-white/10 text-white font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <Heart className="w-4 h-4 text-brand-green fill-brand-green/20" />
            Tus Me Gusta
          </div>
          {likedCount > 0 && (
            <span className="text-xs bg-white/10 text-zinc-300 px-2 py-0.5 rounded-full font-mono">
              {likedCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onNavigate('history')}
          className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            currentView === 'history'
              ? 'bg-white/10 text-white font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <History className="w-4 h-4" />
          Historial
        </button>
      </nav>

      {/* Playlist Section Divider */}
      <div className="px-5 mt-6 mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Music className="w-3 h-3 text-brand-green" />
          Tus Playlists
        </span>
        <button
          onClick={() => setShowCreateModal(true)}
          className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Crear playlist"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Custom Playlists list */}
      <div className="flex-1 overflow-y-auto px-3 space-y-0.5 scrollbar-thin">
        {playlists.length === 0 ? (
          <div className="px-4 py-6 text-center text-zinc-500 text-xs">
            <p className="mb-2">No tienes playlists creadas todavía.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-brand-green hover:underline font-semibold"
            >
              + Crear la primera
            </button>
          </div>
        ) : (
          playlists.map((pl) => {
            const isSelected = currentView === `playlist_${pl.id}`;
            return (
              <div
                key={pl.id}
                onClick={() => onNavigate('playlist', pl.id)}
                className={`group flex items-center justify-between px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-white/10 text-brand-green font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-md overflow-hidden bg-white/5 flex-shrink-0">
                    <img
                      src={pl.coverUrl}
                      alt={pl.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="truncate">{pl.name}</span>
                </div>
                <button
                  onClick={(e) => handleDeletePlaylist(e, pl.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-opacity"
                  title="Eliminar playlist"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Spotify Importer & Backup Action */}
      <div className="p-4 border-t border-white/5 space-y-2">
        <button
          onClick={onOpenImportExport}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-300 hover:text-white hover:bg-emerald-500/20 text-xs font-semibold transition-all shadow-sm"
        >
          <DownloadCloud className="w-4 h-4" />
          Importar Spotify / Backup
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 text-center pt-1">
          <Sparkles className="w-3 h-3 text-brand-green" />
          <span>True Shuffle · GitHub Pages Edition</span>
        </div>
      </div>

      {/* Modal for creating a playlist */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleCreatePlaylist}
            className="w-full max-w-sm bg-[#181818] border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white">Nueva Playlist</h3>
            <input
              type="text"
              autoFocus
              placeholder="Nombre de la playlist..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-brand-green"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!newPlaylistName.trim()}
                className="px-4 py-2 rounded-xl bg-brand-green text-black font-semibold text-xs hover:scale-105 transition-all disabled:opacity-50"
              >
                Crear
              </button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
};
