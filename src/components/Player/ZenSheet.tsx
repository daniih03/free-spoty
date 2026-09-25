import React from 'react';
import { ChevronDown, ListPlus, Mic2, ListMusic, Sliders, Sparkles } from 'lucide-react';
import { usePlayer } from '../../state/player';
import { ui } from '../../state/ui';
import { Cover } from '../UI/Primitives';
import { TransportControls, Scrubber, LikeButton } from './Controls';

interface ZenSheetProps {
  onClose: () => void;
  onNavigateArtist: (artistName: string) => void;
}

/** Zen Listening Sheet: reproductor inmersivo a pantalla completa en móvil. */
export default function ZenSheet({ onClose, onNavigateArtist }: ZenSheetProps) {
  const song = usePlayer((s) => s.currentSong);
  if (!song) return null;

  const openAndClose = (fn: () => void) => () => {
    onClose();
    fn();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#090b10] flex flex-col justify-between pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] px-5 sm:px-6 overflow-y-auto animate-slide-up select-none touch-manipulation">
      <div>
        <div className="w-12 h-1 rounded-full bg-white/25 mx-auto mb-2 shrink-0" />
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 text-zinc-300 hover:text-white active:scale-90 transition-transform"
            aria-label="Cerrar reproductor"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
          <div className="text-center min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-coral flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" /> Aura Studio
            </span>
            <p className="text-xs font-semibold text-white truncate max-w-[200px]">{song.album || 'Free-Spoty'}</p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="my-auto py-4 flex flex-col items-center shrink-0">
        <div className="w-56 h-56 xs:w-64 xs:h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-2xl border border-white/15">
          <Cover src={song.coverUrl} size={600} eager alt={song.title} className="w-full h-full" />
        </div>
      </div>

      <div className="space-y-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-4">
            <h2 className="text-xl sm:text-2xl font-black text-white truncate">{song.title}</h2>
            <p
              onClick={openAndClose(() => onNavigateArtist(song.artist))}
              className="text-sm font-medium text-zinc-400 truncate hover:text-white hover:underline cursor-pointer active:opacity-75"
            >
              {song.artist}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => ui.openAddToPlaylist(song)}
              className="p-2.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white active:scale-95 transition-transform"
              title="Añadir a playlist"
            >
              <ListPlus className="w-5 h-5" />
            </button>
            <LikeButton
              song={song}
              className="p-2.5 rounded-full bg-white/5 border border-white/10"
              iconClassName="w-5 h-5"
              activeClassName="text-brand-coral"
            />
          </div>
        </div>

        <Scrubber stacked trackClassName="h-1.5" timeClassName="text-xs" />

        <TransportControls size="lg" className="justify-between py-1" />

        <div className="flex items-center justify-around pt-3 border-t border-white/10">
          {[
            { label: 'Letras', icon: <Mic2 className="w-4 h-4 text-brand-coral" />, fn: ui.openLyrics },
            { label: 'Cola', icon: <ListMusic className="w-4 h-4 text-brand-coral" />, fn: ui.openQueue },
            { label: 'Ajustes', icon: <Sliders className="w-4 h-4" />, fn: ui.openEqualizer },
          ].map((tool) => (
            <button
              key={tool.label}
              onClick={openAndClose(tool.fn)}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 active:text-white px-3.5 py-2.5 rounded-xl bg-white/5 active:bg-white/10"
            >
              {tool.icon} {tool.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
