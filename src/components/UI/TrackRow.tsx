import React, { memo, useState } from 'react';
import { Play, Pause, Trash2, MoreHorizontal } from 'lucide-react';
import type { Song } from '../../types/music';
import { useIsCurrentSong, useIsSongPlaying, playerActions } from '../../state/player';
import { formatTime } from '../../lib/format';
import { LikeButton } from '../Player/Controls';
import { Cover, SoundBars } from './Primitives';
import { SongMenu } from './SongCard';
import { usePrefetchIntent } from '../../hooks/usePrefetchIntent';

interface TrackRowProps {
  song: Song;
  contextQueue: Song[];
  /** Número de pista; si no se da, se usa la posición implícita sin número. */
  number?: number;
  showCover?: boolean;
  /** Se conserva por compatibilidad: ambas variantes comparten estilo. */
  variant?: 'glass' | 'plain';
  subtitle?: 'artist' | 'album';
  /** Muestra la columna de álbum en pantallas anchas. */
  showAlbum?: boolean;
  onNavigateArtist?: (artistName: string) => void;
  onRemove?: () => void;
}

/** Fila de tracklist: número/ecualizador, carátula, título, álbum, me gusta, duración. */
export const TrackRow = memo(function TrackRow({
  song,
  contextQueue,
  number,
  showCover = true,
  subtitle = 'artist',
  showAlbum = false,
  onNavigateArtist,
  onRemove,
}: TrackRowProps) {
  const isCurrent = useIsCurrentSong(song.id);
  const isPlaying = useIsSongPlaying(song.id);
  const prefetch = usePrefetchIntent(song);
  const [showMenu, setShowMenu] = useState(false);

  const handlePlay = () => {
    if (isCurrent) playerActions.togglePlay();
    else playerActions.playSong(song, contextQueue);
  };

  const reveal = 'opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100';

  return (
    <div
      onClick={handlePlay}
      {...prefetch}
      className={`group relative grid items-center gap-3 md:gap-4 px-2 md:px-3 py-2 rounded-lg cursor-pointer transition-colors min-w-0 ${
        showAlbum ? 'grid-cols-[auto_minmax(0,1fr)_auto] md:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_auto]' : 'grid-cols-[auto_minmax(0,1fr)_auto]'
      } ${isCurrent ? 'bg-paper/[0.06]' : 'hover:bg-paper/[0.045]'} ${showMenu ? 'z-30' : ''}`}
    >
      {/* Número / estado */}
      <div className="flex items-center gap-3 md:gap-4">
        {number !== undefined && (
          <div className="w-6 flex justify-center text-[14px] text-mute tabular shrink-0">
            {isPlaying ? (
              <>
                <span className="group-hover:hidden">
                  <SoundBars className="h-3.5 text-brand-coral" />
                </span>
                <Pause className="w-4 h-4 fill-current text-paper hidden group-hover:block" strokeWidth={0} />
              </>
            ) : (
              <>
                <span className={`group-hover:hidden ${isCurrent ? 'text-brand-coral' : ''}`}>{number}</span>
                <Play className="w-4 h-4 fill-current text-paper hidden group-hover:block" strokeWidth={0} />
              </>
            )}
          </div>
        )}

        {showCover && (
          <div className="relative w-11 h-11 rounded-md overflow-hidden flex-shrink-0 bg-lacquer">
            <Cover src={song.coverUrl} size={96} alt="" className="w-full h-full" />
            {number === undefined && (
              <div
                className={`absolute inset-0 bg-ink/60 flex items-center justify-center transition-opacity ${
                  isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                {isPlaying ? (
                  <SoundBars className="h-4 text-brand-coral" />
                ) : (
                  <Play className="w-4 h-4 fill-current text-paper translate-x-[1px]" strokeWidth={0} />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Título */}
      <div className="min-w-0">
        <p className={`truncate text-[15px] font-medium ${isCurrent ? 'text-brand-coral' : 'text-paper'}`}>{song.title}</p>
        {subtitle === 'artist' ? (
          <span
            onClick={(e) => {
              if (!onNavigateArtist) return;
              e.stopPropagation();
              onNavigateArtist(song.artist);
            }}
            className={`block truncate text-[13px] text-mute ${onNavigateArtist ? 'hover:text-paper hover:underline cursor-pointer' : ''}`}
          >
            {song.artist}
          </span>
        ) : (
          song.album && <span className="block truncate text-[13px] text-mute">{song.album}</span>
        )}
      </div>

      {showAlbum && <span className="hidden md:block truncate text-[13px] text-mute">{song.album}</span>}

      {/* Acciones */}
      <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <LikeButton
          song={song}
          className="p-2 rounded-full"
          iconClassName="w-4 h-4"
          inactiveClassName={`text-mute hover:text-paper ${reveal}`}
        />
        {onRemove && (
          <button
            onClick={onRemove}
            className={`p-2 rounded-full text-mute hover:text-brand-rose transition-all ${reveal}`}
            title="Quitar de esta playlist"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <span className="hidden sm:block text-[13px] text-mute w-11 text-right tabular">{formatTime(song.duration)}</span>
        <div className="relative">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className={`p-2 rounded-full text-mute hover:text-paper transition-all ${reveal}`}
            title="Más opciones"
            aria-haspopup="menu"
            aria-expanded={showMenu}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showMenu && (
            <SongMenu song={song} onClose={() => setShowMenu(false)} onNavigateArtist={onNavigateArtist} placement="down" />
          )}
        </div>
      </div>
    </div>
  );
});
