import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { X, Mic2, Music, Sparkles, Play, Pause, ListPlus } from 'lucide-react';
import { usePlayer, progressStore, playerActions } from '../../state/player';
import { useStore } from '../../lib/store';
import { ui } from '../../state/ui';
import { findActiveLine } from '../../services/lyricsService';
import { Cover, Spinner, Vinyl } from '../UI/Primitives';
import { TransportControls, Scrubber, VolumeControl, LikeButton, PlayPauseButton } from './Controls';
import type { SyncedLyricLine } from '../../types/music';

interface LyricsViewProps {
  onNavigateArtist: (artistName: string) => void;
}

/** Visor de estudio a pantalla completa + letras sincronizadas (modo dividido). */
export default function LyricsView({ onNavigateArtist }: LyricsViewProps) {
  const song = usePlayer((s) => s.currentSong);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const [showLyrics, setShowLyrics] = useState(false);

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

  const tab = (active: boolean) =>
    `flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
      active
        ? 'bg-gradient-to-r from-brand-crimson to-brand-red text-white shadow-md shadow-brand-red/30'
        : 'text-zinc-400 hover:text-white'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#090b10]/95 backdrop-blur-3xl text-white select-none animate-fadeIn overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brand-burgundy/20 rounded-full blur-[140px] opacity-60" />
        <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] bg-brand-crimson/15 rounded-full blur-[120px] opacity-40" />
      </div>

      {/* Cabecera */}
      <div className="relative z-20 flex items-center justify-between px-3.5 sm:px-6 md:px-10 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-3.5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-brand-coral shadow-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="hidden xs:block">
            <h2 className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-zinc-400">Aura Studio Visor</h2>
            <p className="text-[10px] sm:text-[11px] text-zinc-500 font-medium hidden sm:block">
              Reproducción a pantalla completa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white/[0.06] border border-white/10 rounded-2xl backdrop-blur-xl shadow-lg">
          <button onClick={() => setShowLyrics(false)} className={tab(!showLyrics)}>
            Visor
          </button>
          <button onClick={() => setShowLyrics(true)} className={tab(showLyrics)}>
            <Mic2 className="w-3.5 h-3.5" />
            <span>Letra</span>
          </button>
        </div>

        <button
          onClick={ui.closeLyrics}
          className="p-2 sm:p-2.5 rounded-full bg-white/[0.06] hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white transition-all shadow-md active:scale-90"
          title="Cerrar (ESC)"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 md:p-10 pb-[max(1rem,env(safe-area-inset-bottom,0px))] flex items-center justify-center">
        {!showLyrics ? (
          /* MODO 1: VISOR DE ESTUDIO CENTRADO */
          <div className="w-full max-w-2xl flex flex-col items-center justify-center text-center space-y-5 sm:space-y-6 animate-fadeIn my-auto py-2 sm:py-4">
            <div className="relative group/vinyl flex items-center justify-center">
              <div className="absolute inset-0 bg-brand-red/15 rounded-full blur-3xl scale-110 pointer-events-none" />
              <Vinyl
                src={song.coverUrl}
                size={800}
                isPlaying={isPlaying}
                grooves
                onClick={playerActions.togglePlay}
                title={isPlaying ? 'Pausar' : 'Reproducir'}
                holeClassName="w-14 h-14 border-2"
                className="w-56 h-56 xs:w-64 xs:h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 shadow-[0_25px_60px_rgba(0,0,0,0.9)] border-4 border-white/20 ring-4 ring-black/80"
              >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover/vinyl:opacity-100 flex items-center justify-center transition-opacity z-20">
                  <div className="w-16 h-16 rounded-full bg-brand-red text-white flex items-center justify-center shadow-2xl shadow-brand-red/50">
                    {isPlaying ? <Pause className="w-7 h-7 fill-white" /> : <Play className="w-7 h-7 fill-white ml-1" />}
                  </div>
                </div>
              </Vinyl>
            </div>

            <div className="space-y-2 pt-2 max-w-xl">
              <div className="flex items-center justify-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-brand-red/20 border border-brand-red/40 text-[10px] font-black uppercase tracking-wider text-brand-coral">
                  Master Studio HD
                </span>
                <span className="text-xs text-zinc-400 font-mono truncate max-w-[220px]">{song.album || 'Audio Oficial'}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {song.title}
              </h1>
              <p
                onClick={goToArtist}
                className="text-base sm:text-xl text-zinc-300 font-semibold hover:text-brand-coral hover:underline cursor-pointer transition-colors"
              >
                {song.artist}
              </p>
            </div>

            <Scrubber className="max-w-lg" trackClassName="h-2 hover:h-3" timeClassName="text-xs" />

            <TransportControls size="lg" className="gap-6 sm:gap-8 pt-1" />

            <div className="flex items-center justify-center gap-4 pt-3 flex-wrap">
              <LikeButton
                song={song}
                className="p-3 rounded-2xl border"
                iconClassName="w-5 h-5"
                activeClassName="bg-brand-burgundy/40 border-brand-red/50 text-brand-coral shadow-lg"
                inactiveClassName="bg-white/[0.05] border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
              />
              <button
                onClick={() => ui.openAddToPlaylist(song)}
                className="p-3 rounded-2xl border bg-white/[0.05] border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all hover:scale-105 shadow-lg"
                title="Añadir a playlist"
              >
                <ListPlus className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowLyrics(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/15 border border-white/10 text-white font-bold text-xs transition-all hover:scale-105 shadow-lg"
              >
                <Mic2 className="w-4 h-4 text-brand-coral" />
                <span>Ver letra sincronizada</span>
              </button>
              <VolumeControl className="rounded-2xl px-4 py-2" sliderClassName="w-24" />
            </div>
          </div>
        ) : (
          /* MODO 2: PANTALLA DIVIDIDA (VISOR + LETRAS) */
          <div className="w-full max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-8 items-center h-full animate-fadeIn">
            {/* Mini-barra móvil */}
            <div className="lg:hidden w-full flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.05] border border-white/10 shrink-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Cover src={song.coverUrl} size={80} alt={song.title} className="w-10 h-10 rounded-xl shadow ring-1 ring-white/10 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{song.title}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{song.artist}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <LikeButton song={song} activeClassName="text-brand-coral" />
                <PlayPauseButton size="sm" />
              </div>
            </div>

            {/* Visor lateral (lg+) */}
            <div className="hidden lg:flex lg:col-span-5 flex-col items-center justify-center text-center space-y-4 p-4">
              <Vinyl
                src={song.coverUrl}
                size={600}
                isPlaying={isPlaying}
                onClick={playerActions.togglePlay}
                title={isPlaying ? 'Pausar' : 'Reproducir'}
                holeClassName="w-10 h-10"
                className="w-72 h-72 shadow-2xl border-4 border-white/20 ring-4 ring-black/80"
              />
              <div className="space-y-1 max-w-sm">
                <h3 className="text-2xl font-black text-white tracking-tight truncate">{song.title}</h3>
                <p onClick={goToArtist} className="text-sm text-zinc-400 font-medium truncate hover:underline hover:text-white cursor-pointer">
                  {song.artist}
                </p>
              </div>
              <Scrubber className="max-w-xs" trackClassName="h-1.5" />
              <div className="flex items-center gap-2">
                <TransportControls className="gap-3" />
                <LikeButton song={song} />
              </div>
              <button onClick={() => setShowLyrics(false)} className="text-xs text-zinc-400 hover:text-white underline pt-1">
                Volver al visor completo
              </button>
            </div>

            <LyricsStream onShowVisor={() => setShowLyrics(false)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Flujo de letras karaoke
// ---------------------------------------------------------------------------

const LyricsStream = memo(function LyricsStream({ onShowVisor }: { onShowVisor: () => void }) {
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
      top: el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2,
      behavior: 'smooth',
    });
  }, [activeIndex]);

  return (
    <div
      ref={containerRef}
      onWheel={pauseAutoScroll}
      onTouchMove={pauseAutoScroll}
      className="relative w-full lg:col-span-7 h-[calc(100dvh-170px)] lg:h-[65vh] overflow-y-auto px-2 lg:pr-4 space-y-6 scrollbar-none text-left py-10 lg:py-20"
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-3">
          <Spinner className="w-8 h-8 border-2 border-brand-coral" />
          <p className="text-sm">Sincronizando letra con la pista...</p>
        </div>
      ) : lines.length > 0 ? (
        <>
          {!synced && (
            <p className="px-5 text-[11px] uppercase tracking-wider font-bold text-zinc-500">
              Letra sin sincronización disponible
            </p>
          )}
          {lines.map((line, idx) => (
            <LyricLine
              key={idx}
              index={idx}
              line={line}
              state={!synced ? 'static' : idx === activeIndex ? 'active' : idx < activeIndex ? 'past' : 'future'}
            />
          ))}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
          <Music className="w-12 h-12 opacity-40 text-brand-coral" />
          <p className="text-lg font-medium text-zinc-300">Pista instrumental o letra no disponible</p>
          <p className="text-xs text-zinc-500 max-w-sm text-center">Disfruta del audio y de la consola de estudio.</p>
          <button
            onClick={onShowVisor}
            className="px-5 py-2 rounded-full bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
          >
            Ver visor de estudio
          </button>
        </div>
      )}
    </div>
  );
});

const EMPTY: SyncedLyricLine[] = [];

const LINE_STYLES = {
  active:
    'text-white text-2xl md:text-4xl font-black scale-[1.03] bg-brand-burgundy/30 shadow-xl shadow-brand-red/10 border-l-4 border-brand-coral pl-6',
  past: 'text-zinc-500 text-lg md:text-2xl font-semibold opacity-50 hover:opacity-100 hover:text-zinc-300',
  future: 'text-zinc-400 text-lg md:text-2xl font-semibold opacity-75 hover:opacity-100 hover:text-white',
  static: 'text-zinc-300 text-lg md:text-2xl font-semibold',
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
    <div
      data-line={index}
      onClick={seekable ? () => playerActions.seek(line.time) : undefined}
      className={`group transition-all duration-300 rounded-2xl px-5 py-2.5 origin-left ${
        seekable ? 'cursor-pointer' : ''
      } ${LINE_STYLES[state]}`}
    >
      <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
        {line.text || '♪'}
      </span>
    </div>
  );
});
