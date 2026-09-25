import React from 'react';
import { ChevronDown, ListPlus, Mic2, ListMusic, SlidersHorizontal } from 'lucide-react';
import { usePlayer } from '../../state/player';
import { ui } from '../../state/ui';
import { useDominantColor } from '../../hooks/useDominantColor';
import { Cover } from '../UI/Primitives';
import { TransportControls, Scrubber, LikeButton } from './Controls';

interface ZenSheetProps {
  onClose: () => void;
  onNavigateArtist: (artistName: string) => void;
}

/** Reproductor a pantalla completa en móvil. El fondo toma el color de la carátula. */
export default function ZenSheet({ onClose, onNavigateArtist }: ZenSheetProps) {
  const song = usePlayer((s) => s.currentSong);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const { primary } = useDominantColor(song?.coverUrl);
  if (!song) return null;

  const then = (fn: () => void) => () => {
    onClose();
    fn();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] px-6 overflow-y-auto animate-slide-up select-none touch-manipulation"
      style={{ background: `linear-gradient(180deg, ${primary} -20%, #110B0C 72%)` }}
    >
      <div className="flex items-center justify-between h-12 shrink-0">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full text-paper/80 hover:text-paper active:scale-90 transition-transform"
          aria-label="Cerrar reproductor"
        >
          <ChevronDown className="w-7 h-7" />
        </button>
        <p className="text-[13px] font-medium text-paper/80 truncate max-w-[60%] text-center">{song.album || 'Sonando ahora'}</p>
        <button
          onClick={() => ui.openAddToPlaylist(song)}
          className="p-2 -mr-2 rounded-full text-paper/80 hover:text-paper active:scale-90 transition-transform"
          title="Añadir a una playlist"
        >
          <ListPlus className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center py-6 min-h-0">
        <div
          className={`w-full max-w-[min(86vw,420px)] aspect-square rounded-xl overflow-hidden shadow-[0_30px_70px_-20px_rgba(0,0,0,0.9)] transition-transform duration-700 ease-spring ${
            isPlaying ? 'scale-100' : 'scale-[0.88]'
          }`}
        >
          <Cover src={song.coverUrl} size={800} eager alt={song.title} className="w-full h-full" />
        </div>
      </div>

      <div className="shrink-0 space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-[26px] leading-tight font-bold text-paper tracking-tight truncate">{song.title}</h2>
            <button
              onClick={then(() => onNavigateArtist(song.artist))}
              className="text-[16px] text-mute truncate max-w-full hover:text-paper transition-colors"
            >
              {song.artist}
            </button>
          </div>
          <LikeButton song={song} className="p-2 -mr-2 rounded-full" iconClassName="w-6 h-6" />
        </div>

        <Scrubber stacked thick timeClassName="text-[12px]" />

        <TransportControls size="lg" className="justify-between -mx-1" />

        <div className="flex items-center justify-between pt-1 text-mute">
          <button onClick={then(ui.openLyrics)} className="flex items-center gap-2 py-2 text-[13px] font-medium hover:text-paper">
            <Mic2 className="w-[18px] h-[18px]" /> Letra
          </button>
          <button onClick={then(ui.openEqualizer)} className="flex items-center gap-2 py-2 text-[13px] font-medium hover:text-paper">
            <SlidersHorizontal className="w-[18px] h-[18px]" /> Sonido
          </button>
          <button onClick={then(ui.openQueue)} className="flex items-center gap-2 py-2 text-[13px] font-medium hover:text-paper">
            <ListMusic className="w-[18px] h-[18px]" /> Cola
          </button>
        </div>
      </div>
    </div>
  );
}
