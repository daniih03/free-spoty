import React, { memo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Volume1,
  VolumeX,
  Heart,
} from 'lucide-react';
import { usePlayer, useCurrentTime, playerActions } from '../../state/player';
import { toggleLikeSong, useIsLiked } from '../../services/storageService';
import { formatTime } from '../../lib/format';
import { Spinner } from '../UI/Primitives';
import type { Song } from '../../types/music';

/**
 * Controles del reproductor compartidos por la cápsula flotante, la Zen Sheet
 * móvil y el visor a pantalla completa. Cada uno se suscribe solo a su trozo
 * de estado: el tick de progreso (4/s) únicamente re-renderiza el Scrubber.
 */

// ---------------------------------------------------------------------------
// Play / Pause
// ---------------------------------------------------------------------------

const PLAY_SIZES = {
  sm: { box: 'w-10 h-10', icon: 'w-4 h-4', spin: 'w-4 h-4 border-2' },
  md: { box: 'w-12 h-12', icon: 'w-5 h-5', spin: 'w-4 h-4 border-2' },
  lg: { box: 'w-16 h-16', icon: 'w-7 h-7', spin: 'w-6 h-6 border-3' },
} as const;

export const PlayPauseButton = memo(function PlayPauseButton({
  size = 'md',
  className = '',
}: {
  size?: keyof typeof PLAY_SIZES;
  className?: string;
}) {
  const isPlaying = usePlayer((s) => s.isPlaying);
  const isLoading = usePlayer((s) => s.isLoading);
  const s = PLAY_SIZES[size];

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        playerActions.togglePlay();
      }}
      className={`${s.box} rounded-full bg-gradient-to-tr from-brand-crimson via-brand-red to-brand-coral text-white flex items-center justify-center shadow-[0_4px_20px_rgba(200,25,0,0.4)] hover:shadow-[0_6px_25px_rgba(200,25,0,0.6)] hover:scale-108 active:scale-95 transition-all touch-manipulation shrink-0 ${className}`}
      title={isPlaying ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'}
      aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
    >
      {isLoading && isPlaying ? (
        <Spinner className={`${s.spin} border-white`} />
      ) : isPlaying ? (
        <Pause className={`${s.icon} fill-white`} />
      ) : (
        <Play className={`${s.icon} fill-white ml-0.5`} />
      )}
    </button>
  );
});

// ---------------------------------------------------------------------------
// Transporte: shuffle · anterior · play · siguiente · repetir
// ---------------------------------------------------------------------------

export const TransportControls = memo(function TransportControls({
  size = 'md',
  className = 'gap-4 sm:gap-6',
}: {
  size?: 'md' | 'lg';
  className?: string;
}) {
  const isShuffle = usePlayer((s) => s.isShuffle);
  const repeatMode = usePlayer((s) => s.repeatMode);
  const icon = size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
  const small = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <button
        onClick={playerActions.toggleShuffle}
        className={`relative p-2 rounded-full transition-colors touch-manipulation ${
          isShuffle ? 'text-brand-coral' : 'text-zinc-400 hover:text-white'
        }`}
        title={isShuffle ? 'True Shuffle activado: aleatoriedad real sin sesgos' : 'Activar True Shuffle'}
        aria-pressed={isShuffle}
      >
        <Shuffle className={small} />
        {isShuffle && (
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-coral rounded-full shadow-[0_0_8px_#ff3b24]" />
        )}
      </button>

      <button
        onClick={playerActions.prevTrack}
        className="p-2 text-zinc-300 hover:text-white hover:scale-110 active:scale-95 transition-all touch-manipulation"
        title="Anterior (←)"
        aria-label="Anterior"
      >
        <SkipBack className={`${icon} fill-current`} />
      </button>

      <PlayPauseButton size={size} />

      <button
        onClick={playerActions.nextTrack}
        className="p-2 text-zinc-300 hover:text-white hover:scale-110 active:scale-95 transition-all touch-manipulation"
        title="Siguiente (→)"
        aria-label="Siguiente"
      >
        <SkipForward className={`${icon} fill-current`} />
      </button>

      <button
        onClick={playerActions.cycleRepeatMode}
        className={`relative p-2 rounded-full transition-colors touch-manipulation ${
          repeatMode !== 'off' ? 'text-brand-coral' : 'text-zinc-400 hover:text-white'
        }`}
        title={`Repetición: ${repeatMode === 'off' ? 'desactivada' : repeatMode === 'all' ? 'toda la lista' : 'canción actual'}`}
      >
        {repeatMode === 'one' ? <Repeat1 className={small} /> : <Repeat className={small} />}
        {repeatMode !== 'off' && (
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-coral rounded-full" />
        )}
      </button>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Scrubber de precisión (ratón, táctil y teclado)
// ---------------------------------------------------------------------------

export function Scrubber({
  className = '',
  trackClassName = 'h-1.5 hover:h-2',
  showTimes = true,
  timeClassName = 'text-[10px]',
  stacked = false,
}: {
  className?: string;
  trackClassName?: string;
  showTimes?: boolean;
  timeClassName?: string;
  /** Tiempos debajo de la barra (móvil) en lugar de a los lados. */
  stacked?: boolean;
}) {
  const currentTime = useCurrentTime();
  const duration = usePlayer((s) => s.duration);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const dragging = useRef(false);

  const shown = dragValue ?? currentTime;
  const percent = duration > 0 ? Math.min(100, (shown / duration) * 100) : 0;

  const commit = () => {
    if (dragging.current && dragValue !== null) playerActions.seek(dragValue);
    dragging.current = false;
    setDragValue(null);
  };

  const track = (
    <div className={`group/track relative flex-1 bg-white/10 rounded-full cursor-pointer transition-all ${trackClassName}`}>
      <div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-crimson via-brand-red to-brand-coral rounded-full"
        style={{ width: `${percent}%` }}
      />
      <input
        type="range"
        min={0}
        max={duration || 100}
        step={0.5}
        value={shown}
        aria-label="Posición de la canción"
        onPointerDown={() => (dragging.current = true)}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (dragging.current) setDragValue(v);
          else playerActions.seek(v); // teclado
        }}
        onPointerUp={commit}
        onPointerCancel={commit}
        onTouchEnd={commit}
        onClick={(e) => e.stopPropagation()}
        className="absolute -inset-y-2 inset-x-0 w-full opacity-0 cursor-pointer touch-none"
      />
    </div>
  );

  if (!showTimes) return <div className={`flex items-center ${className}`}>{track}</div>;

  if (stacked) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <div className="flex items-center py-2">{track}</div>
        <div className={`flex justify-between text-zinc-400 font-mono tabular-nums ${timeClassName}`}>
          <span>{formatTime(shown)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full flex items-center gap-2.5 font-mono tabular-nums select-none ${timeClassName} ${className}`}>
      <span className="w-9 text-right text-zinc-400">{formatTime(shown)}</span>
      {track}
      <span className="w-9 text-left text-zinc-500">{formatTime(duration)}</span>
    </div>
  );
}

/** Barra fina de progreso sin interacción (mini-reproductor móvil). */
export function ProgressLine({ className = '' }: { className?: string }) {
  const currentTime = useCurrentTime();
  const duration = usePlayer((s) => s.duration);
  const percent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  return (
    <div className={`h-[2px] bg-white/10 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-brand-crimson via-brand-red to-brand-coral origin-left"
        style={{ transform: `scaleX(${percent / 100})` }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Volumen
// ---------------------------------------------------------------------------

export const VolumeControl = memo(function VolumeControl({
  className = '',
  sliderClassName = 'w-20',
}: {
  className?: string;
  sliderClassName?: string;
}) {
  const volume = usePlayer((s) => s.volume);
  const isMuted = usePlayer((s) => s.isMuted);
  const shown = isMuted ? 0 : volume;
  const Icon = shown === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] hover:border-white/20 transition-all ${className}`}
    >
      <button
        onClick={playerActions.toggleMute}
        className="text-zinc-400 hover:text-white transition-colors"
        title={isMuted ? 'Activar sonido (M)' : 'Silenciar (M)'}
      >
        <Icon className={`w-4 h-4 ${shown === 0 ? 'text-brand-coral' : ''}`} />
      </button>
      <div className={`relative h-1 hover:h-1.5 bg-white/20 rounded-full cursor-pointer transition-all ${sliderClassName}`}>
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-red to-brand-coral rounded-full"
          style={{ width: `${shown}%` }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={shown}
          onChange={(e) => playerActions.setVolume(parseInt(e.target.value, 10))}
          className="absolute -inset-y-2 inset-x-0 w-full opacity-0 cursor-pointer"
          aria-label="Volumen"
          title={`Volumen: ${shown}%`}
        />
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Me gusta (reactivo: se actualiza en todas las vistas a la vez)
// ---------------------------------------------------------------------------

export const LikeButton = memo(function LikeButton({
  song,
  className = 'p-2 rounded-full',
  iconClassName = 'w-4 h-4',
  activeClassName = 'text-brand-coral drop-shadow-[0_0_8px_rgba(255,59,36,0.5)]',
  inactiveClassName = 'text-zinc-400 hover:text-white',
}: {
  song: Song;
  className?: string;
  iconClassName?: string;
  activeClassName?: string;
  inactiveClassName?: string;
}) {
  const liked = useIsLiked(song.id);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleLikeSong(song);
      }}
      className={`transition-all active:scale-90 touch-manipulation ${className} ${liked ? activeClassName : inactiveClassName}`}
      title={liked ? 'Quitar de Me Gusta' : 'Añadir a Me Gusta'}
      aria-pressed={liked}
    >
      <Heart className={`${iconClassName} ${liked ? 'fill-current' : ''}`} />
    </button>
  );
});
