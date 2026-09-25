import React, { memo } from 'react';
import { Play, Pause, Trash2, ListPlus } from 'lucide-react';
import type { Song } from '../../types/music';
import { useIsCurrentSong, useIsSongPlaying, playerActions } from '../../state/player';
import { ui } from '../../state/ui';
import { formatTime } from '../../lib/format';
import { LikeButton } from '../Player/Controls';
import { Cover, SoundBars } from './Primitives';

interface TrackRowProps {
  song: Song;
  contextQueue: Song[];
  /** Número de pista (estilo lista de artista/álbum). */
  number?: number;
  showCover?: boolean;
  /** 'glass' = tracklist orgánico de playlists; 'plain' = lista compacta. */
  variant?: 'glass' | 'plain';
  subtitle?: 'artist' | 'album';
  onNavigateArtist?: (artistName: string) => void;
  onRemove?: () => void;
}

export const TrackRow = memo(function TrackRow({
  song,
  contextQueue,
  number,
  showCover = true,
  variant = 'glass',
  subtitle = 'artist',
  onNavigateArtist,
  onRemove,
}: TrackRowProps) {
  const isCurrent = useIsCurrentSong(song.id);
  const isPlaying = useIsSongPlaying(song.id);

  const handlePlay = () => {
    if (isCurrent) playerActions.togglePlay();
    else playerActions.playSong(song, contextQueue);
  };

  const container =
    variant === 'glass'
      ? `p-3 rounded-2xl backdrop-blur-xl border transform-gpu hover:-translate-y-0.5 ${
          isCurrent
            ? 'bg-brand-burgundy/30 border-brand-red/50 shadow-[0_4px_24px_rgba(200,25,0,0.18)]'
            : 'bg-[#13141f]/40 hover:bg-[#191b29]/75 border-white/[0.05] hover:border-brand-red/30'
        }`
      : `p-2.5 rounded-xl ${isCurrent ? 'bg-white/15' : 'hover:bg-white/10'}`;

  const reveal = 'opacity-100 md:opacity-0 md:group-hover:opacity-100';

  return (
    <div
      onClick={handlePlay}
      className={`group flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer min-w-0 ${container}`}
    >
      <div className="flex items-center gap-3 md:gap-3.5 min-w-0 flex-1">
        {number !== undefined && (
          <div className="w-6 flex justify-center text-sm font-semibold text-zinc-400 tabular-nums shrink-0">
            {isPlaying ? (
              <>
                <span className="group-hover:hidden">
                  <SoundBars className="h-3.5" />
                </span>
                <Pause className="w-4 h-4 fill-current text-brand-coral hidden group-hover:block" />
              </>
            ) : (
              <>
                <span className="group-hover:hidden">{number}</span>
                <Play className="w-4 h-4 fill-current text-white hidden group-hover:block" />
              </>
            )}
          </div>
        )}

        {showCover && (
          <div className="relative w-11 h-11 md:w-12 md:h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md bg-white/[0.03] border border-white/10">
            <Cover src={song.coverUrl} size={96} alt={song.title} className="w-full h-full" />
            {number === undefined &&
              (isPlaying ? (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <SoundBars className="h-4" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                </div>
              ))}
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-0.5">
          <p
            className={`truncate text-sm font-semibold transition-colors ${
              isCurrent ? 'text-brand-coral' : 'text-white/95 group-hover:text-white'
            }`}
          >
            {song.title}
          </p>
          <div className="flex items-center gap-2 text-xs text-white/45 min-w-0">
            {subtitle === 'artist' ? (
              <>
                <span
                  onClick={(e) => {
                    if (!onNavigateArtist) return;
                    e.stopPropagation();
                    onNavigateArtist(song.artist);
                  }}
                  className={`truncate ${onNavigateArtist ? 'hover:underline hover:text-brand-rose cursor-pointer' : ''}`}
                >
                  {song.artist}
                </span>
                {song.album && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline truncate max-w-[200px] text-zinc-500">{song.album}</span>
                  </>
                )}
              </>
            ) : (
              <span className="truncate">{song.album || song.artist}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => ui.openAddToPlaylist(song)}
          className={`hidden sm:block p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-all ${reveal}`}
          title="Añadir a playlist"
        >
          <ListPlus className="w-3.5 h-3.5" />
        </button>
        <LikeButton
          song={song}
          className="p-2 rounded-lg"
          iconClassName="w-3.5 h-3.5"
          activeClassName="text-brand-coral"
          inactiveClassName={`text-zinc-500 hover:text-white hover:bg-white/10 ${reveal}`}
        />
        {onRemove && (
          <button
            onClick={onRemove}
            className={`p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-white/10 transition-all ${reveal}`}
            title="Quitar de esta playlist"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        <span className="text-xs font-mono text-zinc-500 w-10 text-right tabular-nums">{formatTime(song.duration)}</span>
      </div>
    </div>
  );
});
