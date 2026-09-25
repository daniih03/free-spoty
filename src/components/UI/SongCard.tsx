import React, { memo, useState } from 'react';
import { Play, Pause, MoreVertical, Plus, Disc3, ListPlus } from 'lucide-react';
import type { Song } from '../../types/music';
import { useIsCurrentSong, useIsSongPlaying, playerActions } from '../../state/player';
import { ui } from '../../state/ui';
import { usePlaylists, addSongToPlaylist } from '../../services/storageService';
import { LikeButton } from '../Player/Controls';
import { Cover, SoundBars } from './Primitives';
import { usePrefetchIntent } from '../../hooks/usePrefetchIntent';

interface SongCardProps {
  song: Song;
  contextQueue?: Song[];
  onNavigateArtist?: (artistName: string) => void;
}

/**
 * Aura Minimalist Card. Memoizada y suscrita solo a "¿soy la canción actual?"
 * y "¿estoy en Me Gusta?": una rejilla de 40 tarjetas ya no se re-renderiza
 * con cada tick del reproductor.
 */
export const SongCard = memo(function SongCard({ song, contextQueue, onNavigateArtist }: SongCardProps) {
  const isCurrent = useIsCurrentSong(song.id);
  const isPlaying = useIsSongPlaying(song.id);
  const [showMenu, setShowMenu] = useState(false);
  const prefetch = usePrefetchIntent(song);

  const handlePlay = () => {
    if (isCurrent) playerActions.togglePlay();
    else playerActions.playSong(song, contextQueue);
  };

  return (
    <div
      onClick={handlePlay}
      {...prefetch}
      className={`group relative p-2.5 sm:p-3 rounded-2xl md:rounded-[22px] backdrop-blur-xl transition-all duration-300 cursor-pointer border transform-gpu hover:-translate-y-1 w-full min-w-0 ${
        isCurrent
          ? 'bg-brand-burgundy/25 border-brand-red/50 shadow-[0_8px_30px_rgba(200,25,0,0.2)]'
          : 'bg-[#13141f]/50 hover:bg-[#1b1c2b]/75 border-white/[0.06] hover:border-brand-red/35 shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_32px_rgba(200,25,0,0.12)]'
      } ${showMenu ? 'z-30' : ''}`}
    >
      <div className="relative aspect-square w-full rounded-xl md:rounded-[16px] overflow-hidden mb-3 shadow-md bg-white/[0.03]">
        <Cover
          src={song.coverUrl}
          size={400}
          alt={song.title}
          className="w-full h-full transition-transform duration-500 group-hover:scale-105 transform-gpu"
        />

        {isPlaying && (
          <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-brand-red/30 flex items-center z-10">
            <SoundBars className="h-3.5" />
          </div>
        )}

        <LikeButton
          song={song}
          className="absolute top-2 left-2 p-2 rounded-full backdrop-blur-md z-10"
          iconClassName="w-3.5 h-3.5"
          activeClassName="bg-black/50 text-brand-coral opacity-100 shadow-sm"
          inactiveClassName="bg-black/40 text-white/80 hover:text-white hover:bg-black/60 opacity-80 md:opacity-0 md:group-hover:opacity-100"
        />

        <div
          className={`absolute bottom-2.5 right-2.5 transition-all duration-300 z-10 ${
            isCurrent
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-2 scale-90 md:group-hover:opacity-100 md:group-hover:translate-y-0 md:group-hover:scale-100'
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePlay();
            }}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-crimson via-brand-red to-brand-coral text-white flex items-center justify-center shadow-lg shadow-brand-red/40 hover:scale-110 active:scale-95 transition-all"
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>
        </div>
      </div>

      <div className="flex items-start justify-between gap-1.5 px-0.5">
        <div className="min-w-0 flex-1 space-y-0.5">
          <h4
            className={`text-sm font-medium tracking-tight truncate transition-colors ${
              isCurrent ? 'text-brand-coral font-semibold' : 'text-white/95 group-hover:text-white'
            }`}
          >
            {song.title}
          </h4>
          <p
            onClick={(e) => {
              if (!onNavigateArtist) return;
              e.stopPropagation();
              onNavigateArtist(song.artist);
            }}
            className={`text-xs text-white/45 truncate transition-colors ${
              onNavigateArtist ? 'hover:underline hover:text-brand-rose cursor-pointer active:opacity-75' : ''
            }`}
          >
            {song.artist}
          </p>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((v) => !v);
            }}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-all active:scale-95"
            title="Más opciones"
            aria-haspopup="menu"
            aria-expanded={showMenu}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMenu && <SongMenu song={song} onClose={() => setShowMenu(false)} onNavigateArtist={onNavigateArtist} />}
        </div>
      </div>
    </div>
  );
});

/** Menú contextual (solo se monta al abrirse: la lista de playlists no se lee en cada tarjeta). */
function SongMenu({
  song,
  onClose,
  onNavigateArtist,
}: {
  song: Song;
  onClose: () => void;
  onNavigateArtist?: (artistName: string) => void;
}) {
  const playlists = usePlaylists();
  const run = (fn: () => void) => () => {
    fn();
    onClose();
  };
  const item = 'w-full text-left px-3.5 py-2.5 hover:bg-white/10 flex items-center gap-2.5 text-white/90 transition-colors';

  return (
    <>
      <div
        className="fixed inset-0 z-40 cursor-default"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        role="menu"
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 bottom-full mb-1.5 w-44 sm:w-52 bg-[#161722]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-1.5 z-50 text-xs text-zinc-200 animate-fadeIn"
      >
        {onNavigateArtist && (
          <button onClick={run(() => onNavigateArtist(song.artist))} className={item}>
            <Disc3 className="w-3.5 h-3.5 text-brand-coral" /> Ver artista
          </button>
        )}
        <button onClick={run(() => playerActions.playNextInQueue(song))} className={item}>
          <Plus className="w-3.5 h-3.5 text-brand-coral" /> Reproducir siguiente
        </button>
        <button onClick={run(() => playerActions.addToQueue(song))} className={`${item} text-white/80`}>
          <Plus className="w-3.5 h-3.5 text-zinc-400" /> Añadir al final de la cola
        </button>

        <div className="border-t border-white/10 my-1 pt-1">
          <button onClick={run(() => ui.openAddToPlaylist(song))} className={`${item} font-medium`}>
            <ListPlus className="w-3.5 h-3.5 text-brand-coral" />
            <span>{playlists.length === 0 ? 'Crear playlist y añadir' : 'Añadir a playlist...'}</span>
          </button>
          {playlists.length > 0 && (
            <div className="max-h-28 overflow-y-auto mt-0.5">
              {playlists.slice(0, 5).map((pl) => {
                const already = pl.songs.some((s) => s.id === song.id);
                return (
                  <button
                    key={pl.id}
                    disabled={already}
                    onClick={run(() => addSongToPlaylist(pl.id, song))}
                    className="w-full text-left px-5 py-1.5 hover:bg-white/10 text-xs text-white/70 hover:text-white transition-colors flex items-center justify-between disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <span className="truncate">{pl.name}</span>
                    <Plus className="w-2.5 h-2.5 opacity-50 shrink-0 ml-1" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
