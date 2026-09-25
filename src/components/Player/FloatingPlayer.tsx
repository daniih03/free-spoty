import React, { useState } from 'react';
import { Mic2, ListMusic, ListPlus, Sliders, Maximize2, AlertCircle } from 'lucide-react';
import { usePlayer } from '../../state/player';
import { ui, useUi } from '../../state/ui';
import { Vinyl } from '../UI/Primitives';
import { TransportControls, Scrubber, VolumeControl, LikeButton, PlayPauseButton, ProgressLine } from './Controls';
import ZenSheet from './ZenSheet';

interface FloatingPlayerProps {
  onNavigateArtist: (artistName: string) => void;
}

/**
 * Cápsula de sonido flotante (escritorio) + mini-cápsula móvil.
 * El tiempo de reproducción solo re-renderiza el Scrubber interno.
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

  const toolClass = (active: boolean) =>
    `relative p-2.5 rounded-2xl transition-all ${
      active
        ? 'text-brand-coral bg-brand-red/20 border border-brand-red/30 shadow-sm'
        : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
    }`;

  return (
    <>
      {/* ================================================================ */}
      {/* 1. CÁPSULA FLOTANTE DE ESCRITORIO (md+)                          */}
      {/* ================================================================ */}
      <div className="hidden md:flex fixed bottom-5 left-1/2 -translate-x-1/2 w-[94%] max-w-5xl z-40 select-none">
        <div className="animate-fadeIn relative w-full h-[88px] rounded-full bg-[#101119]/90 backdrop-blur-3xl border border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_40px_rgba(200,25,0,0.08)] hover:border-brand-red/30 hover:shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_50px_rgba(200,25,0,0.16)] flex items-center justify-between px-6 transition-all duration-300">
          {/* Izquierda: vinilo + datos */}
          <div className="flex items-center gap-3.5 min-w-[220px] max-w-[320px]">
            <Vinyl
              src={currentSong.coverUrl}
              size={120}
              isPlaying={isPlaying}
              onClick={ui.openLyrics}
              title="Abrir visor a pantalla completa (F)"
              className="group/art w-14 h-14 shadow-xl border-2 border-white/20 ring-2 ring-black/70"
            >
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/art:opacity-100 flex items-center justify-center transition-opacity z-20">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </Vinyl>

            <div className="min-w-0 flex-1 space-y-0.5">
              <p
                onClick={ui.openLyrics}
                className="text-sm font-bold text-white tracking-tight truncate hover:text-brand-coral cursor-pointer transition-colors"
              >
                {currentSong.title}
              </p>
              {playbackError ? (
                <p className="text-[11px] text-brand-rose truncate flex items-center gap-1" title={playbackError}>
                  <AlertCircle className="w-3 h-3 shrink-0" /> {playbackError}
                </p>
              ) : (
                <p
                  onClick={() => onNavigateArtist(currentSong.artist)}
                  className="text-xs text-zinc-400 truncate hover:text-white hover:underline cursor-pointer transition-colors"
                >
                  {currentSong.artist}
                </p>
              )}
            </div>

            <LikeButton song={currentSong} className="p-2 rounded-full hover:scale-110" />
            <button
              onClick={() => ui.openAddToPlaylist(currentSong)}
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:scale-110 transition-transform"
              title="Añadir a playlist..."
            >
              <ListPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Centro: consola de transporte + scrubber */}
          <div className="flex-1 max-w-lg flex flex-col items-center justify-center gap-1.5 px-3">
            <TransportControls />
            <Scrubber />
          </div>

          {/* Derecha: herramientas + volumen */}
          <div className="flex items-center justify-end gap-2 min-w-[220px]">
            <button onClick={ui.toggleLyrics} className={toolClass(isLyricsOpen)} title="Letras en vivo (F)">
              <Mic2 className="w-4 h-4" />
            </button>
            <button onClick={ui.openQueue} className={toolClass(isQueueOpen)} title="Cola e historial">
              <ListMusic className="w-4 h-4" />
              {upcomingCount > 0 && (
                <span className="absolute -top-1 -right-1 text-[9px] bg-gradient-to-r from-brand-crimson to-brand-red text-white font-extrabold px-1.5 rounded-full border border-[#101119] shadow-sm">
                  {upcomingCount}
                </span>
              )}
            </button>
            <button onClick={ui.openEqualizer} className={toolClass(false)} title="Ecualizador, velocidad y temporizador">
              <Sliders className="w-4 h-4" />
            </button>
            <VolumeControl sliderClassName="w-18 lg:w-20" />
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. MINI-CÁPSULA MÓVIL (< md)                                     */}
      {/* ================================================================ */}
      <div className="md:hidden">
        <div
          onClick={() => setIsMobileExpanded(true)}
          className="fixed bottom-[calc(60px+env(safe-area-inset-bottom,0px)+10px)] inset-x-3.5 h-[64px] bg-[#101119]/95 backdrop-blur-2xl border border-white/[0.12] rounded-full z-40 flex items-center justify-between px-3.5 shadow-2xl cursor-pointer touch-manipulation active:scale-[0.99] transition-transform animate-fadeIn"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
            <Vinyl
              src={currentSong.coverUrl}
              size={96}
              isPlaying={isPlaying}
              holeClassName="w-2.5 h-2.5"
              className="w-11 h-11 border border-white/20 shadow ring-1 ring-black/70"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{currentSong.title}</p>
              <p className={`text-[11px] truncate ${playbackError ? 'text-brand-rose' : 'text-zinc-400'}`}>
                {playbackError || currentSong.artist}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <LikeButton song={currentSong} className="p-2.5 rounded-full" activeClassName="text-brand-coral" />
            <PlayPauseButton size="sm" className="w-11 h-11" />
          </div>

          <ProgressLine className="absolute bottom-0 inset-x-6" />
        </div>

        {isMobileExpanded && (
          <ZenSheet onClose={() => setIsMobileExpanded(false)} onNavigateArtist={onNavigateArtist} />
        )}
      </div>
    </>
  );
};
