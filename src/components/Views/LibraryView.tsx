import React, { useState } from 'react';
import { Heart, History, Plus, DownloadCloud } from 'lucide-react';
import { useFollowedArtists, useHistory, useLikedSongs, usePlaylists } from '../../services/storageService';
import { ui } from '../../state/ui';
import { onImageError } from '../../lib/images';
import { Cover } from '../UI/Primitives';
import { PlaylistSleeve } from '../UI/PlaylistSleeve';
import { CreatePlaylistSheet } from '../UI/CreatePlaylistSheet';

interface LibraryViewProps {
  onSelectPlaylist: (playlistId: string) => void;
  onNavigateLiked: () => void;
  onNavigateHistory: () => void;
  onNavigateArtist: (artistName: string) => void;
}

export default function LibraryView({ onSelectPlaylist, onNavigateLiked, onNavigateHistory, onNavigateArtist }: LibraryViewProps) {
  const playlists = usePlaylists();
  const liked = useLikedSongs();
  const history = useHistory();
  const artists = useFollowedArtists();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 pt-2 md:pt-6 pb-8 min-w-0 space-y-14">
      <div className="flex items-end justify-between gap-4">
        <h1 className="font-display text-display-lg font-extrabold text-paper">Tu biblioteca</h1>
        <div className="flex items-center gap-2 pb-1">
          <button
            onClick={ui.openImportExport}
            className="h-10 px-4 rounded-full text-[13px] font-semibold text-paper bg-paper/[0.07] hover:bg-paper/[0.12] flex items-center gap-2 transition-colors"
          >
            <DownloadCloud className="w-4 h-4" />
            <span className="hidden sm:inline">Importar</span>
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="h-10 px-4 rounded-full text-[13px] font-semibold text-ink bg-paper hover:scale-[1.03] flex items-center gap-2 transition-transform"
          >
            <Plus className="w-4 h-4" />
            Nueva playlist
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 -mt-6">
        <button
          onClick={onNavigateLiked}
          className="group relative h-40 md:h-48 rounded-2xl overflow-hidden text-left p-6 flex flex-col justify-end"
          style={{ background: 'linear-gradient(135deg, #C81900 0%, #540900 100%)' }}
        >
          <Heart className="absolute top-6 right-6 w-16 h-16 md:w-20 md:h-20 text-paper/15 fill-current transition-transform duration-700 ease-spring group-hover:scale-110 group-hover:-rotate-6" />
          <p className="font-display text-[30px] font-extrabold text-paper leading-none">Me gusta</p>
          <p className="text-[14px] text-paper/75 mt-2">{liked.length === 1 ? '1 canción' : `${liked.length} canciones`}</p>
          {liked.length > 0 && (
            <div className="absolute bottom-6 right-6 flex -space-x-3">
              {liked.slice(0, 3).map((s) => (
                <Cover key={s.id} src={s.coverUrl} size={80} alt="" className="w-10 h-10 rounded-md ring-2 ring-[#7a0d00]" />
              ))}
            </div>
          )}
        </button>
        <button
          onClick={onNavigateHistory}
          className="group relative h-40 md:h-48 rounded-2xl overflow-hidden text-left p-6 flex flex-col justify-end bg-raised hover:bg-[#2E1F20] transition-colors"
        >
          <History className="absolute top-6 right-6 w-16 h-16 md:w-20 md:h-20 text-paper/10 transition-transform duration-700 ease-spring group-hover:-rotate-[30deg]" />
          <p className="font-display text-[30px] font-extrabold text-paper leading-none">Historial</p>
          <p className="text-[14px] text-mute mt-2">{history.length === 1 ? '1 canción reciente' : `${history.length} canciones recientes`}</p>
        </button>
      </div>

      <section>
        <h2 className="font-display text-display-md font-bold text-paper mb-6">Tus playlists</h2>
        {playlists.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-paper/15 py-14 px-6 text-center">
            <p className="font-display text-2xl font-bold text-paper">Crea tu primera playlist</p>
            <p className="text-[14px] text-mute mt-2 max-w-sm mx-auto">
              Guarda aquí tus canciones o importa una lista de Spotify pegando los títulos.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-6 h-11 px-6 rounded-full bg-brand-red hover:bg-brand-lightred text-paper font-semibold text-[14px] transition-colors"
            >
              Crear playlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-x-5 gap-y-8">
            {playlists.map((pl) => (
              <PlaylistSleeve key={pl.id} playlist={pl} onOpen={onSelectPlaylist} />
            ))}
          </div>
        )}
      </section>

      {artists.length > 0 && (
        <section>
          <h2 className="font-display text-display-md font-bold text-paper mb-6">Artistas que sigues</h2>
          <div className="shelf">
            {artists.map((a) => (
              <button key={a.name} onClick={() => onNavigateArtist(a.name)} className="group text-center min-w-0">
                <div className="aspect-square rounded-full overflow-hidden bg-lacquer shadow-[0_14px_30px_-16px_rgba(0,0,0,0.9)]">
                  <img
                    src={a.pictureUrl}
                    alt=""
                    loading="lazy"
                    onError={onImageError}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
                <p className="mt-3 text-[14px] font-semibold text-paper truncate">{a.name}</p>
                <p className="text-[13px] text-mute">Artista</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {showCreate && <CreatePlaylistSheet onClose={() => setShowCreate(false)} onCreated={onSelectPlaylist} />}
    </div>
  );
}
