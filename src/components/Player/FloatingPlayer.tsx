import React, { useState } from 'react';
import { Mic2, ListMusic, ListPlus, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { usePlayer } from '../../state/player';
import { ui, useUi } from '../../state/ui';
import { Sleeve } from '../UI/Primitives';
import { TransportControls, Scrubber, VolumeControl, LikeButton, PlayPauseButton, ProgressLine } from './Controls';
import ZenSheet from './ZenSheet';

interface FloatingPlayerProps {
  onNavigateArtist: (artistName: string) => void;
}

/**
 * Cápsula flotante (escritorio) + mini-cápsula (móvil). La carátula es una
 * funda de la que sale el vinilo mientras suena.
 */
export const FloatingPlayer: React.FC<FloatingPlayerProps> = ({ onNavigateArtist }) => {
  const currentSong = usePlayer((s) => s.currentSong);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playbackError = usePlayer((s) => s.playbackError);
  const upcomingCount = usePlayer((s) => Math.max(0, s.queue.length - (s.queueIndex + 1)));
  const isLyricsOpen = useUi((s) => s.lyricsOpen);
  const isQueueOpen = useUi((s) => s.queueOpen);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  if (!currentSong) return null;

  const tool = (active: boolean) =>
    `relative p-2.5 rounded-full transition-colors ${
      active ? 'text-brand-coral bg-brand-red/15' : 'text-mute hover:text-paper hover:bg-paper/[0.06]'
    }`;

  return (
    <>
      {/* ================================================================ */}
      {/* Escritorio                                                        */}
      {/* ================================================================ */}
      <div className="hidden md:block fixed bottom-4 left-[92px] right-4 z-40 select-none pointer-events-none">
        <div className="pointer-events-auto mx-auto max-w-[1100px] h-[84px] rounded-full bg-lacquer/90 backdrop-blur-2xl border border-line shadow-[0_24px_60px_-18px_rgba(0,0,0,0.95)] grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)] items-center gap-4 pl-3.5 pr-5 animate-rise">
          {/* Canción */}
          <div className="flex items-center min-w-0">
            <Sleeve
              src={currentSong.coverUrl}
              size={120}
              isPlaying={isPlaying}
              slide="62%"
              onClick={ui.openLyrics}
              title="Abrir a pantalla completa (F)"
              coverClassName="rounded-md"
              className="w-14 h-14 mr-11"
            />
            <div className="min-w-0 flex-1">
              <button
                onClick={ui.openLyrics}
                className="block max-w-full text-left text-[14px] font-semibold text-paper truncate hover:underline decoration-paper/40 underline-offset-2"
              >
                {currentSong.title}
              </button>
              {playbackError ? (
                <p className="text-[12px] text-brand-rose truncate flex items-center gap-1" title={playbackError}>
                  <AlertCircle className="w-3 h-3 shrink-0" /> {playbackError}
                </p>
              ) : (
                <button
                  onClick={() => onNavigateArtist(currentSong.artist)}
                  className="block max-w-full text-left text-[13px] text-mute truncate hover:text-paper transition-colors"
                >
                  {currentSong.artist}
                </button>
              )}
            </div>
            <LikeButton song={currentSong} className="p-2 rounded-full ml-1" />
            <button
              onClick={() => ui.openAddToPlaylist(currentSong)}
              className="p-2 rounded-full text-mute hover:text-paper transition-colors"
              title="Añadir a una playlist"
            >
              <ListPlus className="w-[18px] h-[18px]" />
            </button>
          </div>

          {/* Transporte */}
          <div className="flex flex-col items-center justify-center gap-1 min-w-0">
            <TransportControls className="gap-4" />
            <Scrubber className="max-w-[460px]" />
          </div>

          {/* Herramientas */}
          <div className="flex items-center justify-end gap-1 min-w-0">
            <button onClick={ui.toggleLyrics} className={tool(isLyricsOpen)} title="Letra (F)">
              <Mic2 className="w-[18px] h-[18px]" />
            </button>
            <button onClick={ui.openQueue} className={tool(isQueueOpen)} title="Cola">
              <ListMusic className="w-[18px] h-[18px]" />
              {upcomingCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 text-[10px] leading-4 text-center rounded-full bg-brand-red text-paper font-semibold tabular">
                  {upcomingCount > 99 ? '99+' : upcomingCount}
                </span>
              )}
            </button>
            <button onClick={ui.openEqualizer} className={tool(false)} title="Sonido y ajustes">
              <SlidersHorizontal className="w-[18px] h-[18px]" />
            </button>
            <VolumeControl className="ml-1" sliderClassName="w-20 lg:w-24" />
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Móvil                                                             */}
      {/* ================================================================ */}
      <div className="md:hidden">
        <div
          onClick={() => setIsMobileExpanded(true)}
          className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px)+8px)] inset-x-2.5 h-[62px] rounded-2xl bg-raised/95 backdrop-blur-2xl border border-line z-40 flex items-center gap-3 pl-2 pr-2 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.9)] cursor-pointer touch-manipulation active:scale-[0.985] transition-transform overflow-hidden animate-rise"
        >
          <Sleeve
            src={currentSong.coverUrl}
            size={96}
            isPlaying={isPlaying}
            slide="48%"
            coverClassName="rounded-lg"
            className="w-[46px] h-[46px] mr-5"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-paper truncate">{currentSong.title}</p>
            <p className={`text-[12px] truncate ${playbackError ? 'text-brand-rose' : 'text-mute'}`}>
              {playbackError || currentSong.artist}
            </p>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <LikeButton song={currentSong} className="p-2.5 rounded-full" />
            <PlayPauseButton size="sm" />
          </div>
          <ProgressLine className="absolute bottom-0 inset-x-0" />
        </div>

        {isMobileExpanded && (
          <ZenSheet onClose={() => setIsMobileExpanded(false)} onNavigateArtist={onNavigateArtist} />
        )}
      </div>
    </>
  );
};
