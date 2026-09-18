import React, { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { isSongLiked, toggleLikeSong } from '../../services/storageService';
import { VersionSelector } from './VersionSelector';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Mic2,
  ListMusic,
  Sliders,
  Heart,
  Maximize2,
} from 'lucide-react';

interface BottomPlayerProps {
  onOpenLyrics: () => void;
  onOpenQueue: () => void;
  onOpenEqualizer: () => void;
  isLyricsOpen: boolean;
  isQueueOpen: boolean;
}

export const BottomPlayer: React.FC<BottomPlayerProps> = ({
  onOpenLyrics,
  onOpenQueue,
  onOpenEqualizer,
  isLyricsOpen,
  isQueueOpen,
}) => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    isLoadingSong,
    queue,
    queueIndex,
    togglePlay,
    seek,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
  } = usePlayer();

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  if (!currentSong) return null;

  const isLiked = isSongLiked(currentSong.id);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentDisplayTime = isSeeking ? seekValue : currentTime;
  const progressPercent = duration > 0 ? (currentDisplayTime / duration) * 100 : 0;
  const upcomingCount = Math.max(0, queue.length - (queueIndex + 1));

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSeekValue(val);
  };

  const handleSliderMouseDown = () => {
    setIsSeeking(true);
  };

  const handleSliderMouseUp = () => {
    seek(seekValue);
    setIsSeeking(false);
  };

  return (
    <footer className="fixed bottom-0 inset-x-0 h-24 bg-[#121212]/90 backdrop-blur-2xl border-t border-white/10 px-4 md:px-6 z-40 flex items-center justify-between transition-all select-none">
      {/* 1. Track Info (Left) */}
      <div className="flex items-center gap-3 w-1/4 min-w-[180px]">
        <div
          onClick={onOpenLyrics}
          className="relative group w-14 h-14 rounded-xl overflow-hidden cursor-pointer shadow-lg flex-shrink-0"
          title="Abrir letras y vista completa (F)"
        >
          <img
            src={currentSong.coverUrl}
            alt={currentSong.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Maximize2 className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="min-w-0 pr-2">
          <p
            onClick={onOpenLyrics}
            className="text-sm font-semibold text-white truncate hover:underline cursor-pointer"
          >
            {currentSong.title}
          </p>
          <p className="text-xs text-zinc-400 truncate hover:text-white transition-colors">
            {currentSong.artist}
          </p>
          <div className="mt-1 flex items-center gap-1.5 sm:hidden">
            <VersionSelector compact />
          </div>
        </div>

        <button
          onClick={() => toggleLikeSong(currentSong)}
          className={`p-1.5 rounded-full hover:scale-110 transition-transform ${
            isLiked ? 'text-brand-green' : 'text-zinc-400 hover:text-white'
          }`}
          title={isLiked ? 'Eliminar de canciones que te gustan' : 'Añadir a canciones que te gustan'}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* 2. Controls & Progress Bar (Center) */}
      <div className="flex flex-col items-center max-w-xl w-2/4 px-2">
        {/* Playback Buttons */}
        <div className="flex items-center gap-4 sm:gap-6 mb-1.5">
          {/* True Shuffle Button */}
          <button
            onClick={toggleShuffle}
            className={`relative p-1.5 rounded-full transition-colors ${
              isShuffle ? 'text-brand-green' : 'text-zinc-400 hover:text-white'
            }`}
            title={
              isShuffle
                ? 'True Shuffle Activado: Distribución 100% aleatoria sin repeticiones de Spotify'
                : 'Activar True Shuffle'
            }
          >
            <Shuffle className="w-4 h-4" />
            {isShuffle && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-green rounded-full shadow-[0_0_8px_#1ed760]" />
            )}
          </button>

          {/* Previous */}
          <button
            onClick={prevTrack}
            className="text-zinc-400 hover:text-white transition-colors p-1"
            title="Anterior (Flecha izquierda)"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Play / Pause Main */}
          <button
            onClick={togglePlay}
            disabled={isLoadingSong}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-white/20"
            title={isPlaying ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'}
          >
            {isLoadingSong ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={nextTrack}
            className="text-zinc-400 hover:text-white transition-colors p-1"
            title="Siguiente (Flecha derecha)"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          {/* Repeat */}
          <button
            onClick={cycleRepeatMode}
            className={`relative p-1.5 rounded-full transition-colors ${
              repeatMode !== 'off' ? 'text-brand-green' : 'text-zinc-400 hover:text-white'
            }`}
            title={`Repetición: ${repeatMode === 'off' ? 'Desactivada' : repeatMode === 'all' ? 'Toda la lista' : 'Canción actual'}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            {repeatMode !== 'off' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-green rounded-full" />
            )}
          </button>
        </div>

        {/* Progress scrub line */}
        <div className="w-full flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
          <span className="w-8 text-right">{formatTime(currentDisplayTime)}</span>
          <div className="relative flex-1 group flex items-center cursor-pointer">
            {/* Background track */}
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden group-hover:h-1.5 transition-all">
              <div
                className="h-full bg-white group-hover:bg-brand-green transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* Range Input for scrub */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentDisplayTime}
              onChange={handleSliderChange}
              onMouseDown={handleSliderMouseDown}
              onMouseUp={handleSliderMouseUp}
              onTouchStart={handleSliderMouseDown}
              onTouchEnd={handleSliderMouseUp}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-4"
            />
          </div>
          <span className="w-8 text-left">{formatTime(duration)}</span>
        </div>
      </div>

      {/* 3. Extra Tools & Volume (Right) */}
      <div className="flex items-center justify-end gap-3 w-1/4 min-w-[200px]">
        {/* Version Selector Pill */}
        <div className="hidden sm:block">
          <VersionSelector compact />
        </div>

        {/* Karaoke Lyrics */}
        <button
          onClick={onOpenLyrics}
          className={`p-2 rounded-full transition-colors ${
            isLyricsOpen ? 'text-brand-green bg-brand-green/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
          title="Letras sincronizadas Apple Music (F)"
        >
          <Mic2 className="w-4 h-4" />
        </button>

        {/* Queue Drawer */}
        <button
          onClick={onOpenQueue}
          className={`relative p-2 rounded-full transition-colors ${
            isQueueOpen ? 'text-brand-green bg-brand-green/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
          title="Cola de reproducción e historial"
        >
          <ListMusic className="w-4 h-4" />
          {upcomingCount > 0 && (
            <span className="absolute -top-1 -right-1 text-[9px] bg-brand-green text-black font-bold px-1 rounded-full">
              {upcomingCount}
            </span>
          )}
        </button>

        {/* Equalizer & Audio modal */}
        <button
          onClick={onOpenEqualizer}
          className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Ecualizador, velocidad y temporizador"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Volume bar */}
        <div className="hidden md:flex items-center gap-1.5 w-28 group">
          <button
            onClick={toggleMute}
            className="text-zinc-400 hover:text-white transition-colors"
            title={isMuted ? 'Activar sonido (M)' : 'Silenciar (M)'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : volume < 50 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <div className="relative flex-1 group flex items-center cursor-pointer">
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden group-hover:h-1.5 transition-all">
              <div
                className="h-full bg-white group-hover:bg-brand-green"
                style={{ width: `${isMuted ? 0 : volume}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseInt(e.target.value, 10))}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-4"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};
