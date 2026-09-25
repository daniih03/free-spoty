import React, { useDeferredValue, useMemo, useState } from 'react';
import { Play, Pause, Shuffle, Trash2, ListMusic, LayoutList, LayoutGrid, Search, Clock3 } from 'lucide-react';
import type { Playlist } from '../../types/music';
import { usePlayer, playerActions, playerStore } from '../../state/player';
import { removeSongFromPlaylist, deleteCustomPlaylist } from '../../services/storageService';
import { useDominantColor } from '../../hooks/useDominantColor';
import { SongCard } from '../UI/SongCard';
import { TrackRow } from '../UI/TrackRow';
import { Sleeve } from '../UI/Primitives';

interface PlaylistViewProps {
  playlist: Playlist | null;
  onNavigateHome: () => void;
  onNavigateArtist: (artistName: string) => void;
}

function formatLength(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

export default function PlaylistView({ playlist, onNavigateHome, onNavigateArtist }: PlaylistViewProps) {
  const [filter, setFilter] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const deferredFilter = useDeferredValue(filter);
  const songs = playlist?.songs ?? [];
  const { rgb } = useDominantColor(playlist?.coverUrl);

  // ¿Suena alguna canción de esta playlist? (primitivo → re-render solo al cambiar)
  const songIds = useMemo(() => new Set(songs.map((s) => s.id)), [songs]);
  const isPlaylistPlaying = usePlayer((s) => s.isPlaying && !!s.currentSong && songIds.has(s.currentSong.id));

  const filtered = useMemo(() => {
    const q = deferredFilter.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        (s.album && s.album.toLowerCase().includes(q))
    );
  }, [songs, deferredFilter]);

  if (!playlist) {
    return (
      <div className="py-24 text-center max-w-sm mx-auto px-6">
        <ListMusic className="w-10 h-10 text-faint mx-auto" />
        <h2 className="font-display text-2xl font-bold text-paper mt-4">Esta playlist ya no existe</h2>
        <button onClick={onNavigateHome} className="mt-6 h-11 px-6 rounded-full bg-paper text-ink font-semibold text-[14px]">
          Volver al inicio
        </button>
      </div>
    );
  }

  const totalSeconds = songs.reduce((acc, s) => acc + (s.duration || 0), 0);

  const handlePlayAll = () => {
    if (!songs.length) return;
    if (isPlaylistPlaying) playerActions.togglePlay();
    else playerActions.playSong(songs[0], songs);
  };

  const handleShufflePlay = () => {
    if (!songs.length) return;
    if (!playerStore.get().isShuffle) playerActions.toggleShuffle();
    playerActions.playSong(songs[Math.floor(Math.random() * songs.length)], songs);
  };

  const handleDelete = () => {
    if (confirm(`¿Eliminar la playlist "${playlist.name}"?`)) {
      deleteCustomPlaylist(playlist.id);
      onNavigateHome();
    }
  };

  const iconBtn = 'w-11 h-11 flex items-center justify-center rounded-full text-mute hover:text-paper hover:bg-paper/[0.07] transition-colors';

  return (
    <div className="min-w-0">
      {/* Cabecera teñida con el color de la carátula */}
      <header
        className="relative -mt-[calc(60px+env(safe-area-inset-top,0px))] md:-mt-[72px] px-4 sm:px-6 md:px-10 pt-[calc(76px+env(safe-area-inset-top,0px))] md:pt-[112px] pb-8"
        style={{ background: `linear-gradient(180deg, rgba(${rgb}, 0.55) 0%, rgba(${rgb}, 0.15) 65%, transparent 100%)` }}
      >
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-end gap-6 md:gap-10">
          <Sleeve
            src={playlist.coverUrl}
            size={520}
            isPlaying={isPlaylistPlaying}
            slide="30%"
            coverClassName="rounded-xl"
            className="w-48 h-48 md:w-60 md:h-60 mx-auto md:mx-0 md:mr-[72px]"
            alt={playlist.name}
          />
          <div className="min-w-0 text-center md:text-left">
            <p className="text-[13px] font-medium text-paper/75">{playlist.isCustom ? 'Tu playlist' : 'Playlist'}</p>
            <h1 className="font-display text-display-xl font-extrabold text-paper mt-2 break-words text-balance">{playlist.name}</h1>
            {playlist.description && <p className="text-[15px] text-paper/70 mt-4 max-w-2xl mx-auto md:mx-0">{playlist.description}</p>}
            <p className="text-[14px] text-paper/60 mt-3 tabular">
              {songs.length === 1 ? '1 canción' : `${songs.length} canciones`}
              {totalSeconds > 0 && `, ${formatLength(totalSeconds)}`}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 pb-8">
        {/* Acciones */}
        <div className="flex items-center gap-2 md:gap-3 py-2">
          <button
            onClick={handlePlayAll}
            disabled={!songs.length}
            className="w-14 h-14 rounded-full bg-brand-red hover:bg-brand-lightred text-paper flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-40 mr-1"
            title={isPlaylistPlaying ? 'Pausar' : 'Reproducir'}
            aria-label={isPlaylistPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaylistPlaying ? (
              <Pause className="w-6 h-6 fill-current" strokeWidth={0} />
            ) : (
              <Play className="w-6 h-6 fill-current translate-x-[1px]" strokeWidth={0} />
            )}
          </button>
          <button onClick={handleShufflePlay} disabled={!songs.length} className={iconBtn} title="Reproducir en aleatorio real">
            <Shuffle className="w-6 h-6" />
          </button>
          {playlist.isCustom && (
            <button onClick={handleDelete} className={`${iconBtn} hover:!text-brand-rose`} title="Eliminar playlist">
              <Trash2 className="w-5 h-5" />
            </button>
          )}

          <div className="ml-auto flex items-center gap-1">
            {songs.length > 5 &&
              (showFilter ? (
                <input
                  autoFocus
                  type="search"
                  placeholder="Buscar en esta lista"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  onBlur={() => !filter && setShowFilter(false)}
                  className="h-9 w-40 sm:w-56 px-4 rounded-full bg-paper/[0.08] text-[13px] text-paper placeholder-mute outline-none focus:ring-1 focus:ring-paper/25 animate-fade-in"
                />
              ) : (
                <button onClick={() => setShowFilter(true)} className={iconBtn} title="Buscar en esta lista">
                  <Search className="w-5 h-5" />
                </button>
              ))}
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              className={iconBtn}
              title={viewMode === 'list' ? 'Ver como cuadrícula' : 'Ver como lista'}
            >
              {viewMode === 'list' ? <LayoutGrid className="w-5 h-5" /> : <LayoutList className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Canciones */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-2xl font-bold text-paper">
              {songs.length === 0 ? 'Todavía no hay canciones' : 'Ninguna canción coincide'}
            </p>
            {songs.length === 0 && (
              <p className="text-[14px] text-mute mt-2">
                Busca una canción y usa el menú <span className="text-paper">···</span> para añadirla aquí.
              </p>
            )}
          </div>
        ) : viewMode === 'list' ? (
          <div className="mt-4 -mx-2 md:-mx-3">
            <div className="hidden md:grid grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-4 px-3 pb-2 mb-2 border-b border-line text-[13px] text-mute">
              <span className="flex gap-4">
                <span className="w-6 text-center">#</span>
                <span className="w-11" />
              </span>
              <span>Título</span>
              <span>Álbum</span>
              <span className="flex justify-end w-[124px] pr-[40px]">
                <Clock3 className="w-4 h-4" aria-label="Duración" />
              </span>
            </div>
            {filtered.map((song, i) => (
              <TrackRow
                key={song.id}
                song={song}
                number={i + 1}
                contextQueue={songs}
                showAlbum
                onNavigateArtist={onNavigateArtist}
                onRemove={playlist.isCustom ? () => removeSongFromPlaylist(playlist.id, song.id) : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-x-5 gap-y-7">
            {filtered.map((song) => (
              <SongCard key={song.id} song={song} contextQueue={songs} onNavigateArtist={onNavigateArtist} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
