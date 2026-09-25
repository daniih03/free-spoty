import React, { useState } from 'react';
import { Heart, History, Plus, Music, DownloadCloud, Trash2, Mic2 } from 'lucide-react';
import {
  deleteCustomPlaylist,
  useFollowedArtists,
  useHistory,
  useLikedSongs,
  usePlaylists,
} from '../../services/storageService';
import { ui } from '../../state/ui';
import { Cover } from '../UI/Primitives';
import { onImageError } from '../../lib/images';
import { CreatePlaylistSheet } from '../UI/CreatePlaylistSheet';

interface LibraryViewProps {
  onSelectPlaylist: (playlistId: string) => void;
  onNavigateLiked: () => void;
  onNavigateHistory: () => void;
  onNavigateArtist: (artistName: string) => void;
}

export default function LibraryView({ onSelectPlaylist, onNavigateLiked, onNavigateHistory, onNavigateArtist }: LibraryViewProps) {
  const playlists = usePlaylists();
  const likedCount = useLikedSongs().length;
  const historyCount = useHistory().length;
  const artists = useFollowedArtists();
  const [showCreate, setShowCreate] = useState(false);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('¿Eliminar esta playlist?')) deleteCustomPlaylist(id);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-3.5 sm:p-6 md:p-8 space-y-6 min-w-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Tu Biblioteca</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-white transition-colors"
            title="Nueva playlist"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={ui.openImportExport}
            className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-brand-coral transition-colors"
            title="Importar y copias de seguridad"
          >
            <DownloadCloud className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <button
          onClick={onNavigateLiked}
          className="text-left group relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-brand-red via-brand-crimson to-brand-burgundy border border-white/10 hover:border-white/25 shadow-lg hover:shadow-xl hover:shadow-brand-red/20 transition-all duration-200 transform-gpu hover:-translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">Tus Me Gusta</h3>
          <p className="text-xs text-brand-blush mt-1">{likedCount} canciones</p>
        </button>

        <button
          onClick={onNavigateHistory}
          className="text-left group relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-red-950 via-brand-wine to-brand-burgundy border border-brand-red/20 hover:border-brand-red/45 shadow-lg hover:shadow-xl hover:shadow-brand-red/10 transition-all duration-200 transform-gpu hover:-translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-red/25 border border-brand-red/30 flex items-center justify-center mb-3">
            <History className="w-5 h-5 text-brand-coral" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">Historial</h3>
          <p className="text-xs text-brand-rose mt-1">{historyCount} recientes</p>
        </button>
      </div>

      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Music className="w-4 h-4 text-brand-coral" />
            Tus listas ({playlists.length})
          </h2>
          <button onClick={() => setShowCreate(true)} className="text-xs font-semibold text-brand-coral hover:underline">
            + Crear nueva
          </button>
        </div>

        {playlists.length === 0 ? (
          <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl text-zinc-400 space-y-2">
            <Music className="w-8 h-8 mx-auto opacity-30 text-brand-coral" />
            <p className="text-sm font-semibold text-white">Aún no tienes playlists</p>
            <p className="text-xs text-zinc-500">Crea tu primera lista o importa directamente desde Spotify.</p>
            <button
              onClick={() => setShowCreate(true)}
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
                className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 bg-white/[0.03] border border-white/5 hover:border-brand-red/20 cursor-pointer transition-all min-w-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Cover src={pl.coverUrl} size={96} alt={pl.name} className="w-12 h-12 rounded-lg flex-shrink-0 shadow-md" />
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
      </section>

      {artists.length > 0 && (
        <section className="space-y-3 pt-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Mic2 className="w-4 h-4 text-brand-coral" />
            Artistas que sigues ({artists.length})
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
            {artists.map((a) => (
              <button key={a.name} onClick={() => onNavigateArtist(a.name)} className="group text-center min-w-0">
                <div className="aspect-square rounded-full overflow-hidden border-2 border-white/10 group-hover:border-brand-red/50 shadow-lg transition-all group-hover:scale-105">
                  <img
                    src={a.pictureUrl}
                    alt={a.name}
                    loading="lazy"
                    onError={onImageError}
                    className="w-full h-full object-cover bg-zinc-900"
                  />
                </div>
                <p className="mt-2 text-xs font-semibold text-white truncate group-hover:text-brand-coral transition-colors">
                  {a.name}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {showCreate && <CreatePlaylistSheet onClose={() => setShowCreate(false)} onCreated={onSelectPlaylist} />}
    </div>
  );
}
