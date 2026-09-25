import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ListPlus } from 'lucide-react';
import { usePlayer, progressStore, playerActions } from '../../state/player';
import { useStore } from '../../lib/store';
import { ui } from '../../state/ui';
import { findActiveLine } from '../../services/lyricsService';
import { artwork } from '../../lib/images';
import { Cover, Record } from '../UI/Primitives';
import { TransportControls, Scrubber, VolumeControl, LikeButton, PlayPauseButton } from './Controls';
import type { SyncedLyricLine } from '../../types/music';

interface LyricsViewProps {
  onNavigateArtist: (artistName: string) => void;
}

/** Pantalla completa: vinilo grande o letra sincronizada, sobre la carátula difuminada. */
export default function LyricsView({ onNavigateArtist }: LyricsViewProps) {
  const song = usePlayer((s) => s.currentSong);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const hasLyrics = usePlayer((s) => !!s.lyrics?.lines.length);
  const [mode, setMode] = useState<'player' | 'lyrics'>('player');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && ui.closeLyrics();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!song) return null;

  const goToArtist = () => {
    ui.closeLyrics();
    onNavigateArtist(song.artist);
  };

  const tab = (value: 'player' | 'lyrics', label: string) => (
    <button
      onClick={() => setMode(value)}
      className={`h-8 px-4 rounded-full text-[13px] font-semibold transition-colors ${
        mode === value ? 'bg-paper text-ink' : 'text-paper/70 hover:text-paper'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink text-paper select-none overflow-hidden animate-fade-in">
      {/* Fondo: la propia carátula, muy difuminada */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <img
          src={artwork(song.coverUrl, 120)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-125 blur-[80px] opacity-60 transition-opacity duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/70 to-ink" />
      </div>

      <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 pt-[max(0.75rem,env(safe-area-inset-top,0px))] h-[calc(64px+env(safe-area-inset-top,0px))] shrink-0">
        <button
          onClick={ui.closeLyrics}
          className="w-10 h-10 rounded-full flex items-center justify-center text-paper/80 hover:text-paper hover:bg-paper/10 transition-colors"
          title="Cerrar (Esc)"
          aria-label="Cerrar"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-1 p-1 rounded-full bg-ink/50 backdrop-blur-md">
          {tab('player', 'Reproductor')}
          {tab('lyrics', 'Letra')}
        </div>
        <button
          onClick={() => ui.openAddToPlaylist(song)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-paper/80 hover:text-paper hover:bg-paper/10 transition-colors"
          title="Añadir a una playlist"
        >
          <ListPlus className="w-5 h-5" />
        </button>
      </div>

      {mode === 'player' ? (
        <div key="player" className="relative z-10 flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center gap-8 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] animate-view">
          <Record
            src={song.coverUrl}
            size={420}
            isPlaying={isPlaying}
            onClick={playerActions.togglePlay}
            title={isPlaying ? 'Pausar' : 'Reproducir'}
            className={`w-[min(72vw,52vh,420px)] aspect-square transition-transform duration-700 ease-spring ${isPlaying ? 'scale-100' : 'scale-[0.94]'}`}
          />

          <div className="w-full max-w-xl text-center">
            <h1 className="font-display text-display-lg font-extrabold text-paper text-balance">{song.title}</h1>
            <button onClick={goToArtist} className="text-[17px] text-paper/70 hover:text-paper mt-2 transition-colors">
              {song.artist}
            </button>
          </div>

          <div className="w-full max-w-xl space-y-5">
            <Scrubber thick timeClassName="text-[12px]" />
            <TransportControls size="lg" className="gap-8" />
            <div className="flex items-center justify-between">
              <LikeButton song={song} className="p-2 -ml-2 rounded-full" iconClassName="w-6 h-6" />
              {hasLyrics && (
                <button onClick={() => setMode('lyrics')} className="text-[13px] font-semibold text-paper/70 hover:text-paper">
                  Ver letra
                </button>
              )}
              <VolumeControl className="hidden sm:flex" sliderClassName="w-28" />
            </div>
          </div>
        </div>
      ) : (
        <div key="lyrics" className="relative z-10 flex-1 min-h-0 grid grid-rows-[auto_minmax(0,1fr)] lg:grid-rows-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-6 lg:gap-8 px-4 sm:px-8 lg:px-16 animate-view">
          {/* Barra compacta (móvil) */}
          <div className="lg:hidden flex items-center gap-3 shrink-0">
            <Cover src={song.coverUrl} size={96} alt="" className="w-12 h-12 rounded-md" />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-paper truncate">{song.title}</p>
              <p className="text-[13px] text-paper/60 truncate">{song.artist}</p>
            </div>
            <PlayPauseButton size="sm" />
          </div>

          {/* Columna del reproductor (escritorio) */}
          <div className="hidden lg:flex flex-col items-center justify-center gap-6 pb-10">
            <Record
              src={song.coverUrl}
              size={360}
              isPlaying={isPlaying}
              onClick={playerActions.togglePlay}
              className="w-[min(30vw,46vh)] aspect-square"
            />
            <div className="text-center max-w-sm">
              <h2 className="font-display text-3xl font-bold text-paper leading-tight">{song.title}</h2>
              <button onClick={goToArtist} className="text-[15px] text-paper/70 hover:text-paper mt-1">
                {song.artist}
              </button>
            </div>
            <div className="w-full max-w-sm space-y-4">
              <Scrubber timeClassName="text-[12px]" />
              <TransportControls className="gap-5" />
            </div>
          </div>

          <LyricsStream onShowPlayer={() => setMode('player')} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Letra karaoke
// ---------------------------------------------------------------------------

const LyricsStream = memo(function LyricsStream({ onShowPlayer }: { onShowPlayer: () => void }) {
  const lyrics = usePlayer((s) => s.lyrics);
  const isLoading = usePlayer((s) => s.isLoadingLyrics);
  const lines = lyrics?.lines ?? EMPTY;
  const synced = !!lyrics?.synced;

  // Solo cambia cuando se pasa de verso (no en cada tick de 250 ms)
  const activeIndex = useStore(progressStore, (s) => (synced ? findActiveLine(lines, s.currentTime) : -1));

  const containerRef = useRef<HTMLDivElement>(null);
  const userScrollUntil = useRef(0);

  const pauseAutoScroll = useCallback(() => {
    userScrollUntil.current = Date.now() + 4000;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || activeIndex < 0 || Date.now() < userScrollUntil.current) return;
    const el = container.querySelector<HTMLElement>(`[data-line="${activeIndex}"]`);
    if (!el) return;
    container.scrollTo({
      top: el.offsetTop - container.clientHeight * 0.38 + el.clientHeight / 2,
      behavior: 'smooth',
    });
  }, [activeIndex]);

  return (
    <div
      ref={containerRef}
      onWheel={pauseAutoScroll}
      onTouchMove={pauseAutoScroll}
      className="relative min-h-0 h-full overflow-y-auto scrollbar-none py-[30vh] [mask-image:linear-gradient(transparent,black_18%,black_78%,transparent)]"
    >
      {isLoading ? (
        <div className="space-y-5 animate-pulse">
          {[80, 60, 72, 45, 66].map((w, i) => (
            <div key={i} className="h-8 md:h-10 rounded-lg bg-paper/[0.08]" style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : lines.length > 0 ? (
        <div className="space-y-4 md:space-y-6">
          {!synced && <p className="text-[14px] text-paper/50 mb-6">Esta letra no está sincronizada con la canción.</p>}
          {lines.map((line, idx) => (
            <LyricLine
              key={idx}
              index={idx}
              line={line}
              state={!synced ? 'static' : idx === activeIndex ? 'active' : idx < activeIndex ? 'past' : 'future'}
            />
          ))}
        </div>
      ) : (
        <div className="text-center lg:text-left">
          <p className="font-display text-3xl font-bold text-paper">No hay letra para esta canción</p>
          <p className="text-[15px] text-paper/60 mt-2">Puede ser instrumental o que aún no la tengamos.</p>
          <button onClick={onShowPlayer} className="mt-6 h-10 px-5 rounded-full bg-paper/10 hover:bg-paper/15 text-[14px] font-semibold">
            Volver al reproductor
          </button>
        </div>
      )}
    </div>
  );
});

const EMPTY: SyncedLyricLine[] = [];

const LINE_STYLES = {
  active: 'text-paper',
  past: 'text-paper/35 hover:text-paper/70',
  future: 'text-paper/25 hover:text-paper/60',
  static: 'text-paper/85',
} as const;

const LyricLine = memo(function LyricLine({
  line,
  index,
  state,
}: {
  line: SyncedLyricLine;
  index: number;
  state: keyof typeof LINE_STYLES;
}) {
  const seekable = state !== 'static';
  return (
    <p
      data-line={index}
      onClick={seekable ? () => playerActions.seek(line.time) : undefined}
      className={`font-display text-[28px] md:text-[40px] leading-[1.15] font-bold tracking-tight origin-left transition-[color,transform] duration-500 ease-out ${
        seekable ? 'cursor-pointer' : ''
      } ${state === 'active' ? 'scale-100' : 'scale-[0.97]'} ${LINE_STYLES[state]}`}
    >
      {line.text || '♪'}
    </p>
  );
});
