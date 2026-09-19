import React, { useState, useEffect } from 'react';
import {
  Heart,
  History,
  Plus,
  Music,
  DownloadCloud,
  Trash2,
  Sparkles,
} from 'lucide-react';
import {
  getCustomPlaylists,
  saveCustomPlaylist,
  deleteCustomPlaylist,
  getLikedSongs,
  getPlayHistory,
} from '../../services/storageService';
import { Playlist } from '../../types/music';

interface LibraryViewProps {
  onSelectPlaylist: (playlistId: string) => void;
  onNavigateLiked: () => void;
  onNavigateHistory: () => void;
  onOpenImportExport: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onSelectPlaylist,
  onNavigateLiked,
  onNavigateHistory,
  onOpenImportExport,
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedCount, setLikedCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const refreshData = () => {
    setPlaylists(getCustomPlaylists());
    setLikedCount(getLikedSongs().length);
    setHistoryCount(getPlayHistory().length);
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('free_spoty_storage_change', refreshData);
    return () => window.removeEventListener('free_spoty_storage_change', refreshData);
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const pl = saveCustomPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setShowCreateModal(false);
    onSelectPlaylist(pl.id);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('¿Eliminar esta playlist?')) {
      deleteCustomPlaylist(id);
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden p-3.5 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Tu Biblioteca
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-white transition-colors"
            title="Nueva playlist"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenImportExport}
            className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-brand-coral transition-colors"
            title="Importar de Spotify"
          >
            <DownloadCloud className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Featured Library Cards: Liked & History */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Liked Songs Card */}
        <div
          onClick={onNavigateLiked}
          className="group relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-800 to-indigo-900 border border-white/10 hover:border-white/25 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 transform-gpu"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">Tus Me Gusta</h3>
          <p className="text-xs text-purple-200 mt-1">{likedCount} canciones</p>
        </div>

        {/* History Card - Luxury Velvet Wine & Ruby */}
        <div
          onClick={onNavigateHistory}
          className="group relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-red-950 via-brand-wine to-brand-burgundy border border-brand-red/20 hover:border-brand-red/45 cursor-pointer shadow-lg hover:shadow-xl hover:shadow-brand-red/10 transition-all duration-200 transform-gpu"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-red/25 border border-brand-red/30 flex items-center justify-center mb-3">
            <History className="w-5 h-5 text-brand-coral" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">Historial</h3>
          <p className="text-xs text-brand-rose mt-1">{historyCount} recientes</p>
        </div>
      </div>

      {/* Playlists List */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Music className="w-4 h-4 text-brand-coral" />
            Tus Listas ({playlists.length})
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-xs font-semibold text-brand-coral hover:underline"
          >
            + Crear nueva
          </button>
        </div>

        {playlists.length === 0 ? (
          <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl text-zinc-400 space-y-2">
            <Music className="w-8 h-8 mx-auto opacity-30 text-brand-coral" />
            <p className="text-sm font-semibold text-white">Aún no tienes playlists</p>
            <p className="text-xs text-zinc-500">
              Crea tu primera lista o importa directamente desde Spotify.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-brand-crimson to-brand-red hover:from-brand-red hover:to-brand-coral text-white font-semibold text-xs inline-block shadow-md shadow-brand-red/20 transition-all"
            >
              Crear playlist
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => onSelectPlaylist(pl.id)}
                className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 bg-white/[0.03] border border-white/5 hover:border-brand-red/20 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={pl.coverUrl}
                    alt={pl.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0 shadow-md"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-brand-coral transition-colors">
                      {pl.name}
                    </p>
                    <p className="text-xs text-zinc-400">{pl.songs.length} canciones</p>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDelete(e, pl.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 opacity-60 group-hover:opacity-100 transition-opacity"
                  title="Eliminar playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for creating playlist */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-sm bg-[#181818] border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white">Nueva Playlist</h3>
            <input
              type="text"
              autoFocus
              placeholder="Nombre de la playlist..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-brand-coral"
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
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-crimson to-brand-red hover:from-brand-red hover:to-brand-coral text-white font-semibold text-xs disabled:opacity-50 shadow-md shadow-brand-red/20 transition-all"
              >
                Crear
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
