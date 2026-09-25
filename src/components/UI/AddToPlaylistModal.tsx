import React, { useState } from 'react';
import { Plus, Check, ListPlus, Music } from 'lucide-react';
import type { Playlist, Song } from '../../types/music';
import { ui } from '../../state/ui';
import { addSongToPlaylist, createPlaylistWithSong, usePlaylists } from '../../services/storageService';
import { Cover, Sheet, inputClass, primaryButtonClass } from './Primitives';

export default function AddToPlaylistModal({ song }: { song: Song }) {
  const playlists = usePlaylists();
  const [isCreating, setIsCreating] = useState(playlists.length === 0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  const done = (text: string) => {
    setFeedback({ text, ok: true });
    setTimeout(ui.closeAddToPlaylist, 750);
  };

  const handleSelect = (pl: Playlist) => {
    if (pl.songs.some((s) => s.id === song.id)) {
      setFeedback({ text: `Esta canción ya está en «${pl.name}»`, ok: false });
      return;
    }
    if (addSongToPlaylist(pl.id, song)) done(`¡Añadida a «${pl.name}»!`);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    createPlaylistWithSong(trimmed, song, description.trim() || undefined);
    done(`¡Playlist «${trimmed}» creada con la canción!`);
  };

  return (
    <Sheet
      onClose={ui.closeAddToPlaylist}
      zIndex="z-[9999]"
      icon={<ListPlus className="w-5 h-5" />}
      title={isCreating ? 'Crear y añadir a playlist' : 'Añadir a playlist'}
      subtitle="Organiza tus pistas favoritas en tu biblioteca"
    >
      <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/5 mb-5">
        <Cover src={song.coverUrl} size={96} eager alt={song.title} className="w-12 h-12 rounded-xl shadow-md shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{song.title}</p>
          <p className="text-xs text-zinc-400 truncate mt-0.5">{song.artist}</p>
        </div>
      </div>

      {feedback && (
        <div
          className={`mb-4 p-3 rounded-2xl text-xs flex items-center gap-2.5 animate-fadeIn ${
            feedback.ok ? 'bg-brand-red/15 border border-brand-red/30 text-white' : 'bg-white/5 border border-white/10 text-zinc-300'
          }`}
        >
          {feedback.ok ? <Check className="w-4 h-4 text-brand-coral shrink-0" /> : <Music className="w-4 h-4 text-zinc-400 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {isCreating ? (
        <form onSubmit={handleCreate} className="space-y-4">
          {playlists.length === 0 && (
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-zinc-300">
              Aún no tienes ninguna playlist. Ponle nombre y la canción se añadirá directamente.
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Nombre de la playlist <span className="text-brand-coral">*</span>
            </label>
            <input
              autoFocus
              required
              maxLength={80}
              placeholder="Ej. Mis Favoritas, Modo Concentración..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Descripción (opcional)</label>
            <input
              maxLength={200}
              placeholder="Breve descripción o temática"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
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
                className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Volver a mis listas
              </button>
            ) : (
              <span />
            )}
            <button type="submit" disabled={!name.trim()} className={primaryButtonClass}>
              <Plus className="w-4 h-4" />
              Crear y añadir
            </button>
          </div>
        </form>
      ) : (
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
            Crear nueva playlist
          </button>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
            {playlists.map((pl) => {
              const already = pl.songs.some((s) => s.id === song.id);
              return (
                <button
                  key={pl.id}
                  onClick={() => handleSelect(pl)}
                  disabled={already}
                  className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all ${
                    already ? 'bg-white/5 opacity-60 cursor-not-allowed' : 'hover:bg-white/10 active:scale-[0.99]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Cover src={pl.coverUrl} size={80} alt="" className="w-10 h-10 rounded-xl shadow shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{pl.name}</p>
                      <p className="text-[10px] text-zinc-400">
                        {pl.songs.length} {pl.songs.length === 1 ? 'canción' : 'canciones'}
                      </p>
                    </div>
                  </div>
                  {already ? (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-brand-coral px-2.5 py-1 rounded-full bg-brand-coral/10 border border-brand-coral/20 shrink-0">
                      <Check className="w-3 h-3" /> Añadida
                    </span>
                  ) : (
                    <span className="p-2 rounded-xl text-zinc-400 shrink-0">
                      <Plus className="w-4 h-4" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Sheet>
  );
}
