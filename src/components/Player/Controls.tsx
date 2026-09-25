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
  md: { box: 'w-11 h-11', icon: 'w-[18px] h-[18px]', spin: 'w-4 h-4 border-2' },
  lg: { box: 'w-16 h-16', icon: 'w-7 h-7', spin: 'w-6 h-6 border-[3px]' },
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
      className={`${s.box} rounded-full bg-brand-red text-paper flex items-center justify-center hover:bg-brand-lightred hover:scale-105 active:scale-95 transition-[transform,background-color] duration-200 ease-out touch-manipulation shrink-0 ${className}`}
      title={isPlaying ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'}
      aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
    >
      {isLoading && isPlaying ? (
        <Spinner className={`${s.spin} border-paper`} />
      ) : isPlaying ? (
        <Pause className={`${s.icon} fill-current`} strokeWidth={0} />
      ) : (
        <Play className={`${s.icon} fill-current translate-x-[1px]`} strokeWidth={0} />
      )}
    </button>
  );
});

// ---------------------------------------------------------------------------
// Transporte: aleatorio · anterior · play · siguiente · repetir
// ---------------------------------------------------------------------------

function ModeDot({ on }: { on: boolean }) {
  return (
    <span
      className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-coral transition-all duration-300 ${
        on ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
      }`}
    />
  );
}

export const TransportControls = memo(function TransportControls({
  size = 'md',
  className = 'gap-5',
}: {
  size?: 'md' | 'lg';
  className?: string;
}) {
  const isShuffle = usePlayer((s) => s.isShuffle);
  const repeatMode = usePlayer((s) => s.repeatMode);
  const skip = size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';
  const mode = size === 'lg' ? 'w-5 h-5' : 'w-[18px] h-[18px]';
  const iconBtn = 'relative p-1.5 transition-colors touch-manipulation';

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <button
        onClick={playerActions.toggleShuffle}
        className={`${iconBtn} ${isShuffle ? 'text-brand-coral' : 'text-mute hover:text-paper'}`}
        title={isShuffle ? 'Aleatorio real activado' : 'Activar aleatorio real'}
        aria-pressed={isShuffle}
      >
        <Shuffle className={mode} />
        <ModeDot on={isShuffle} />
      </button>

      <button
        onClick={playerActions.prevTrack}
        className={`${iconBtn} text-paper/85 hover:text-paper active:scale-90`}
        title="Anterior (←)"
        aria-label="Anterior"
      >
        <SkipBack className={`${skip} fill-current`} strokeWidth={1.5} />
      </button>

      <PlayPauseButton size={size} />

      <button
        onClick={playerActions.nextTrack}
        className={`${iconBtn} text-paper/85 hover:text-paper active:scale-90`}
        title="Siguiente (→)"
        aria-label="Siguiente"
      >
        <SkipForward className={`${skip} fill-current`} strokeWidth={1.5} />
      </button>

      <button
        onClick={playerActions.cycleRepeatMode}
        className={`${iconBtn} ${repeatMode !== 'off' ? 'text-brand-coral' : 'text-mute hover:text-paper'}`}
        title={`Repetir: ${repeatMode === 'off' ? 'no' : repeatMode === 'all' ? 'toda la lista' : 'esta canción'}`}
      >
        {repeatMode === 'one' ? <Repeat1 className={mode} /> : <Repeat className={mode} />}
        <ModeDot on={repeatMode !== 'off'} />
      </button>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Scrubber de precisión (ratón, táctil y teclado)
// ---------------------------------------------------------------------------

export function Scrubber({
  className = '',
  thick = false,
  showTimes = true,
  timeClassName = 'text-[11px]',
  stacked = false,
}: {
  className?: string;
  /** Pista más gruesa (visor a pantalla completa y móvil). */
  thick?: boolean;
  showTimes?: boolean;
  timeClassName?: string;
  /** Tiempos debajo de la barra (móvil) en lugar de a los lados. */
  stacked?: boolean;
  /** @deprecated se mantiene por compatibilidad */
  trackClassName?: string;
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
    <div className="group/track relative flex-1 flex items-center h-4 cursor-pointer">
      <div className={`relative w-full rounded-full bg-paper/15 overflow-hidden transition-[height] duration-200 ${thick ? 'h-1.5' : 'h-1 group-hover/track:h-1.5'}`}>
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-colors ${
            dragValue !== null ? 'bg-brand-coral' : 'bg-paper group-hover/track:bg-brand-coral'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div
        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-paper shadow-md pointer-events-none transition-opacity ${
          dragValue !== null ? 'opacity-100' : 'opacity-0 group-hover/track:opacity-100'
        }`}
        style={{ left: `${percent}%` }}
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
        className="absolute inset-0 w-full opacity-0 cursor-pointer touch-none"
      />
    </div>
  );

  if (!showTimes) return <div className={`flex items-center ${className}`}>{track}</div>;

  if (stacked) {
    return (
      <div className={className}>
        {track}
        <div className={`flex justify-between text-mute tabular mt-1 ${timeClassName}`}>
          <span>{formatTime(shown)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full flex items-center gap-3 tabular select-none ${timeClassName} ${className}`}>
      <span className="w-9 text-right text-mute">{formatTime(shown)}</span>
      {track}
      <span className="w-9 text-left text-faint">{formatTime(duration)}</span>
    </div>
  );
}

/** Línea fina de progreso sin interacción (mini-reproductor móvil). */
export function ProgressLine({ className = '' }: { className?: string }) {
  const currentTime = useCurrentTime();
  const duration = usePlayer((s) => s.duration);
  const percent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  return (
    <div className={`h-[2px] bg-paper/10 overflow-hidden ${className}`}>
      <div
        className="h-full w-full bg-brand-coral origin-left transition-transform duration-300 ease-linear"
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
  sliderClassName = 'w-24',
}: {
  className?: string;
  sliderClassName?: string;
}) {
  const volume = usePlayer((s) => s.volume);
  const isMuted = usePlayer((s) => s.isMuted);
  const shown = isMuted ? 0 : volume;
  const Icon = shown === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  return (
    <div className={`group/vol flex items-center gap-2 ${className}`}>
      <button
        onClick={playerActions.toggleMute}
        className="p-1.5 text-mute hover:text-paper transition-colors"
        title={isMuted ? 'Activar sonido (M)' : 'Silenciar (M)'}
      >
        <Icon className="w-[18px] h-[18px]" />
      </button>
      <div className={`relative flex items-center h-4 cursor-pointer ${sliderClassName}`}>
        <div className="relative w-full h-1 rounded-full bg-paper/15 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-paper group-hover/vol:bg-brand-coral transition-colors"
            style={{ width: `${shown}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={shown}
          onChange={(e) => playerActions.setVolume(parseInt(e.target.value, 10))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
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
  iconClassName = 'w-[18px] h-[18px]',
  activeClassName = 'text-brand-coral',
  inactiveClassName = 'text-mute hover:text-paper',
}: {
  song: Song;
  className?: string;
  iconClassName?: string;
  activeClassName?: string;
  inactiveClassName?: string;
}) {
  const liked = useIsLiked(song.id);
  const [pop, setPop] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (toggleLikeSong(song)) {
          setPop(true);
          setTimeout(() => setPop(false), 400);
        }
      }}
      className={`transition-colors touch-manipulation ${className} ${liked ? activeClassName : inactiveClassName}`}
      title={liked ? 'Quitar de Me gusta' : 'Añadir a Me gusta'}
      aria-pressed={liked}
    >
      <Heart
        className={`${iconClassName} transition-transform duration-300 ease-spring ${liked ? 'fill-current' : ''} ${
          pop ? 'scale-125' : 'scale-100'
        }`}
      />
    </button>
  );
});
