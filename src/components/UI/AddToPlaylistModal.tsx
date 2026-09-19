import React, { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import {
  getCustomPlaylists,
  addSongToPlaylist,
  createPlaylistWithSong,
} from '../../services/storageService';
import { Playlist } from '../../types/music';
import { Plus, Check, ListPlus, Music, X } from 'lucide-react';

export const AddToPlaylistModal: React.FC = () => {
  const { addToPlaylistSong, closeAddToPlaylistModal } = usePlayer();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDesc, setPlaylistDesc] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const refreshPlaylists = () => {
    const list = getCustomPlaylists();
    setPlaylists(list);
    // If no playlists exist, default to create view
    if (list.length === 0) {
      setIsCreating(true);
    }
  };

  useEffect(() => {
    if (addToPlaylistSong) {
      refreshPlaylists();
      setPlaylistName('');
      setPlaylistDesc('');
      setFeedback(null);
      const list = getCustomPlaylists();
      setIsCreating(list.length === 0);
    }
  }, [addToPlaylistSong]);

  useEffect(() => {
    window.addEventListener('free_spoty_storage_change', refreshPlaylists);
    return () => window.removeEventListener('free_spoty_storage_change', refreshPlaylists);
  }, []);

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  if (!addToPlaylistSong) return null;

  const handleSelectPlaylist = (playlist: Playlist) => {
    if (!addToPlaylistSong) return;

    const alreadyIn = playlist.songs.some((s) => s.id === addToPlaylistSong.id);
    if (alreadyIn) {
      setFeedback({
        text: `Esta canción ya está en «${playlist.name}»`,
        type: 'error',
      });
      return;
    }

    const success = addSongToPlaylist(playlist.id, addToPlaylistSong);
    if (success) {
      setFeedback({
        text: `¡Añadida a «${playlist.name}» con éxito!`,
        type: 'success',
      });
      setTimeout(() => {
        closeAddToPlaylistModal();
      }, 750);
    }
  };

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addToPlaylistSong || !playlistName.trim()) return;

    const newName = playlistName.trim();
    createPlaylistWithSong(newName, addToPlaylistSong, playlistDesc.trim() || undefined);

    setFeedback({
      text: `¡Playlist «${newName}» creada y canción añadida!`,
      type: 'success',
    });

    setTimeout(() => {
      closeAddToPlaylistModal();
    }, 850);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xl animate-fade-in touch-manipulation"
      onClick={closeAddToPlaylistModal}
    >
      <div
        className="relative w-full max-w-md bg-neutral-900/95 border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl shadow-black/90 backdrop-blur-2xl max-h-[90dvh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] sm:pb-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="w-12 h-1 bg-white/25 rounded-full mx-auto mb-3 sm:hidden shrink-0" />
        {/* Ambient Glow Accent */}
        <div className="absolute -top-24 -right-24 w-44 h-44 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-44 h-44 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeAddToPlaylistModal}
          className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-crimson to-brand-coral flex items-center justify-center text-white shadow-lg shadow-brand-crimson/25 shrink-0">
            <ListPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {playlists.length === 0 || isCreating ? 'Crear y Añadir a Playlist' : 'Añadir a Playlist'}
            </h3>
            <p className="text-xs text-neutral-400">
              Guarda tus pistas favoritas organizadas en tu biblioteca
            </p>
          </div>
        </div>

        {/* Current Song Preview Banner */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/5 mb-5">
          <img
            src={addToPlaylistSong.coverUrl}
            alt={addToPlaylistSong.title}
            className="w-12 h-12 rounded-xl object-cover shadow-md shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80';
            }}
          />
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">
              {addToPlaylistSong.title}
            </p>
            <p className="text-xs text-neutral-400 truncate mt-0.5">
              {addToPlaylistSong.artist}
            </p>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mb-4 p-3 rounded-2xl text-xs flex items-center gap-2.5 animate-fade-in ${
              feedback.type === 'success'
                ? 'bg-red-500/15 border border-red-500/30 text-white'
                : 'bg-neutral-800 border border-white/10 text-neutral-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 text-brand-coral shrink-0" />
            ) : (
              <Music className="w-4 h-4 text-neutral-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Mode A: Create Playlist and Add in One Go */}
        {isCreating ? (
          <form onSubmit={handleCreateAndAdd} className="space-y-4">
            {playlists.length === 0 && (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-neutral-300">
                Aún no tienes ninguna playlist creada. Introduce los datos a continuación para crear tu primera lista y añadir esta canción directamente.
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Nombre de la playlist <span className="text-brand-coral">*</span>
              </label>
              <input
                ref={inputRef}
                type="text"
                required
                placeholder="Ej. Mis Favoritas, Modo Concentración, Para el Coche..."
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-coral/70 focus:ring-2 focus:ring-brand-coral/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Descripción (opcional)
              </label>
              <input
                type="text"
                placeholder="Breve descripción o temática de la lista"
                value={playlistDesc}
                onChange={(e) => setPlaylistDesc(e.target.value)}
                className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-coral/70 focus:ring-2 focus:ring-brand-coral/20 transition-all"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              {playlists.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setFeedback(null);
                  }}
                  className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Volver a mis listas
                </button>
              ) : (
                <div />
              )}

              <button
                type="submit"
                disabled={!playlistName.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-crimson to-brand-coral hover:from-red-600 hover:to-rose-500 text-white font-semibold text-xs shadow-lg shadow-brand-crimson/25 transition-all transform active:scale-95 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Crear y añadir canción</span>
              </button>
            </div>
          </form>
        ) : (
          /* Mode B: Choose Existing Playlist or Toggle Create */
          <div className="space-y-3">
            <button
              onClick={() => {
                setIsCreating(true);
                setFeedback(null);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-white/10 group-hover:bg-brand-coral/20 flex items-center justify-center text-brand-coral transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <span>Crear nueva playlist</span>
            </button>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {playlists.map((pl) => {
                const isAlreadyIn = pl.songs.some((s) => s.id === addToPlaylistSong.id);
                return (
                  <button
                    key={pl.id}
                    onClick={() => handleSelectPlaylist(pl)}
                    disabled={isAlreadyIn}
                    className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all ${
                      isAlreadyIn
                        ? 'bg-white/5 opacity-60 cursor-not-allowed'
                        : 'hover:bg-white/10 active:scale-[0.99] cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={pl.coverUrl}
                        alt={pl.name}
                        className="w-10 h-10 rounded-xl object-cover shadow shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-white truncate">
                          {pl.name}
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          {pl.songs.length} {pl.songs.length === 1 ? 'canción' : 'canciones'}
                        </p>
                      </div>
                    </div>

                    {isAlreadyIn ? (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-brand-coral px-2.5 py-1 rounded-full bg-brand-coral/10 border border-brand-coral/20 shrink-0">
                        <Check className="w-3 h-3" /> Añadida
                      </span>
                    ) : (
                      <span className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 shrink-0">
                        <Plus className="w-4 h-4" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
