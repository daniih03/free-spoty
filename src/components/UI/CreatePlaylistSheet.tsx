import React, { useState } from 'react';
import { ListPlus } from 'lucide-react';
import { saveCustomPlaylist } from '../../services/storageService';
import { Sheet, inputClass, primaryButtonClass } from './Primitives';

export function CreatePlaylistSheet({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (playlistId: string) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const pl = saveCustomPlaylist(name.trim(), description.trim() || undefined);
    onClose();
    onCreated(pl.id);
  };

  return (
    <Sheet onClose={onClose} title="Nueva colección" subtitle="Crea una playlist en tu biblioteca" icon={<ListPlus className="w-5 h-5" />} maxWidth="max-w-sm">
      <form onSubmit={submit} className="space-y-3">
        <input
          autoFocus
          placeholder="Título de la lista..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          maxLength={80}
        />
        <input
          placeholder="Descripción (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
          maxLength={200}
        />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs text-mute hover:text-paper">
            Cancelar
          </button>
          <button type="submit" disabled={!name.trim()} className={primaryButtonClass}>
            Crear
          </button>
        </div>
      </form>
    </Sheet>
  );
}
