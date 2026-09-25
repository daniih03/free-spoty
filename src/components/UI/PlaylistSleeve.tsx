import React, { memo } from 'react';
import { Play, Pause } from 'lucide-react';
import type { Playlist } from '../../types/music';
import { usePlayer, playerActions } from '../../state/player';
import { Sleeve } from './Primitives';

/**
 * Playlist como funda de disco: al pasar el cursor el vinilo asoma; si está
 * sonando, se queda fuera girando.
 */
export const PlaylistSleeve = memo(function PlaylistSleeve({
  playlist,
  onOpen,
}: {
  playlist: Playlist;
  onOpen: (id: string) => void;
}) {
  const isPlayingThis = usePlayer(
    (s) => s.isPlaying && !!s.currentSong && playlist.songs.some((song) => song.id === s.currentSong!.id)
  );
  const count = playlist.songs.length;

  return (
    <div className="group min-w-0">
      <button
        onClick={() => onOpen(playlist.id)}
        className="sleeve-peek block w-full text-left"
        aria-label={`Abrir ${playlist.name}`}
      >
        <Sleeve
          src={playlist.coverUrl}
          size={420}
          isPlaying={isPlayingThis}
          slide="26%"
          coverClassName="rounded-lg"
          className="w-[84%] aspect-square"
          alt={playlist.name}
        />
      </button>
      <div className="flex items-start justify-between gap-2 mt-3 pr-[16%]">
        <button onClick={() => onOpen(playlist.id)} className="min-w-0 text-left">
          <p className="text-[15px] font-semibold text-paper leading-snug line-clamp-2 group-hover:underline decoration-paper/30 underline-offset-2">
            {playlist.name}
          </p>
          <p className="text-[13px] text-mute truncate">{count === 1 ? '1 canción' : `${count} canciones`}</p>
        </button>
        {count > 0 && (
          <button
            onClick={() => (isPlayingThis ? playerActions.togglePlay() : playerActions.playSong(playlist.songs[0], playlist.songs))}
            className="mt-0.5 w-9 h-9 shrink-0 rounded-full bg-brand-red text-paper flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-brand-lightred"
            title={isPlayingThis ? 'Pausar' : 'Reproducir'}
          >
            {isPlayingThis ? (
              <Pause className="w-4 h-4 fill-current" strokeWidth={0} />
            ) : (
              <Play className="w-4 h-4 fill-current translate-x-[1px]" strokeWidth={0} />
            )}
          </button>
        )}
      </div>
    </div>
  );
});
