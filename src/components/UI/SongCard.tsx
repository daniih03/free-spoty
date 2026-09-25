import React, { memo, useState } from 'react';
import { Play, Pause, MoreHorizontal, ListStart, ListEnd, Disc3, ListPlus, Plus } from 'lucide-react';
import type { Song } from '../../types/music';
import { useIsCurrentSong, useIsSongPlaying, playerActions } from '../../state/player';
import { ui } from '../../state/ui';
import { usePlaylists, addSongToPlaylist } from '../../services/storageService';
import { LikeButton } from '../Player/Controls';
import { Cover, Record } from './Primitives';
import { usePrefetchIntent } from '../../hooks/usePrefetchIntent';

interface SongCardProps {
  song: Song;
  contextQueue?: Song[];
  onNavigateArtist?: (artistName: string) => void;
}

/**
 * Tarjeta de canción. Memoizada y suscrita solo a "¿soy la actual?" y
 * "¿estoy en Me gusta?". Si está sonando, un vinilo gira en la esquina.
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
      className={`group relative p-2 -m-2 rounded-2xl cursor-pointer min-w-0 transition-colors duration-300 hover:bg-paper/[0.045] ${
        showMenu ? 'z-30' : ''
      }`}
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-lacquer shadow-[0_14px_30px_-16px_rgba(0,0,0,0.9)]">
        <Cover
          src={song.coverUrl}
          size={400}
          alt={song.title}
          className="w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />

        <LikeButton
          song={song}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-ink/55 backdrop-blur-md"
          iconClassName="w-4 h-4"
          activeClassName="text-brand-coral"
          inactiveClassName="text-paper/90 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
        />

        {/* Sonando: vinilo girando en la esquina (identidad "funda + disco") */}
        {isCurrent ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePlay();
            }}
            className="absolute -bottom-3 -right-3 w-[58%] aspect-square animate-fade-in"
            title={isPlaying ? 'Pausar' : 'Reproducir'}
            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            <Record src={song.coverUrl} size={120} isPlaying={isPlaying} className="w-full h-full" />
            {!isPlaying && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-9 h-9 rounded-full bg-brand-red text-paper flex items-center justify-center shadow-lg">
                  <Play className="w-4 h-4 fill-current translate-x-[1px]" strokeWidth={0} />
                </span>
              </span>
            )}
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePlay();
            }}
            className="absolute bottom-2.5 right-2.5 w-11 h-11 rounded-full bg-brand-red text-paper flex items-center justify-center shadow-[0_10px_24px_-6px_rgba(0,0,0,0.8)] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 focus-visible:opacity-100 transition-all duration-300 ease-out hover:scale-105"
            title="Reproducir"
            aria-label={`Reproducir ${song.title}`}
          >
            <Play className="w-5 h-5 fill-current translate-x-[1px]" strokeWidth={0} />
          </button>
        )}
      </div>

      <div className="flex items-start gap-1 mt-3">
        <div className="min-w-0 flex-1">
          <h4 className={`text-[14px] font-semibold leading-snug truncate ${isCurrent ? 'text-brand-coral' : 'text-paper'}`}>
            {song.title}
          </h4>
          <p
            onClick={(e) => {
              if (!onNavigateArtist) return;
              e.stopPropagation();
              onNavigateArtist(song.artist);
            }}
            className={`text-[13px] text-mute truncate mt-0.5 ${onNavigateArtist ? 'hover:text-paper hover:underline cursor-pointer' : ''}`}
          >
            {song.artist}
          </p>
        </div>

        <div className="relative shrink-0 -mr-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((v) => !v);
            }}
            className="p-1.5 rounded-full text-mute hover:text-paper hover:bg-paper/10 opacity-100 md:opacity-0 md:group-hover:opacity-100 aria-expanded:opacity-100 transition-all"
            title="Más opciones"
            aria-haspopup="menu"
            aria-expanded={showMenu}
          >
            <MoreHorizontal className="w-[18px] h-[18px]" />
          </button>
          {showMenu && <SongMenu song={song} onClose={() => setShowMenu(false)} onNavigateArtist={onNavigateArtist} />}
        </div>
      </div>
    </div>
  );
});

/** Menú contextual (solo se monta al abrirse). */
export function SongMenu({
  song,
  onClose,
  onNavigateArtist,
  placement = 'up',
}: {
  song: Song;
  onClose: () => void;
  onNavigateArtist?: (artistName: string) => void;
  placement?: 'up' | 'down';
}) {
  const playlists = usePlaylists();
  const run = (fn: () => void) => () => {
    fn();
    onClose();
  };
  const item =
    'w-full text-left px-3 py-2 rounded-lg hover:bg-paper/[0.07] flex items-center gap-3 text-[13px] text-paper/90 transition-colors';

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
        className={`absolute right-0 ${
          placement === 'up' ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2 origin-top-right'
        } w-56 max-w-[calc(100vw-2rem)] bg-raised border border-line rounded-xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.9)] p-1.5 z-50 animate-scale-up`}
      >
        <button onClick={run(() => playerActions.playNextInQueue(song))} className={item}>
          <ListStart className="w-4 h-4 text-mute" /> Reproducir a continuación
        </button>
        <button onClick={run(() => playerActions.addToQueue(song))} className={item}>
          <ListEnd className="w-4 h-4 text-mute" /> Añadir a la cola
        </button>
        {onNavigateArtist && (
          <button onClick={run(() => onNavigateArtist(song.artist))} className={item}>
            <Disc3 className="w-4 h-4 text-mute" /> Ir al artista
          </button>
        )}

        <div className="h-px bg-line my-1.5 mx-2" />
        <button onClick={run(() => ui.openAddToPlaylist(song))} className={item}>
          <ListPlus className="w-4 h-4 text-mute" />
          {playlists.length === 0 ? 'Crear playlist con esta canción' : 'Añadir a una playlist…'}
        </button>
        {playlists.slice(0, 4).map((pl) => {
          const already = pl.songs.some((s) => s.id === song.id);
          return (
            <button
              key={pl.id}
              disabled={already}
              onClick={run(() => addSongToPlaylist(pl.id, song))}
              className={`${item} pl-10 text-mute hover:text-paper disabled:opacity-40 disabled:pointer-events-none`}
            >
              <span className="truncate flex-1">{pl.name}</span>
              <Plus className="w-3.5 h-3.5 shrink-0" />
            </button>
          );
        })}
      </div>
    </>
  );
}
