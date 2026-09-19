import React, { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { isSongLiked, toggleLikeSong } from '../../services/storageService';
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
  Mic2,
  ListMusic,
  Heart,
  Sliders,
  ChevronDown,
  Maximize2,
  Sparkles,
} from 'lucide-react';

interface FloatingPlayerProps {
  onOpenLyrics: () => void;
  onOpenQueue: () => void;
  onOpenEqualizer: () => void;
  isLyricsOpen: boolean;
  isQueueOpen: boolean;
  onNavigateArtist?: (artistName: string) => void;
}

export const FloatingPlayer: React.FC<FloatingPlayerProps> = ({
  onOpenLyrics,
  onOpenQueue,
  onOpenEqualizer,
  isLyricsOpen,
  isQueueOpen,
  onNavigateArtist,
}) => {
  const {
    currentSong,
    isPlaying,
    isLoadingSong,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
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
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);

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
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP FLOATING SOUND CAPSULE (md: and up)                            */}
      {/* ========================================================================= */}
      <div className="hidden md:flex fixed bottom-5 left-1/2 -translate-x-1/2 w-[92%] max-w-4xl z-40 transition-all select-none">
        <div className="relative w-full h-[76px] rounded-full bg-[#12131a]/85 backdrop-blur-3xl border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex items-center justify-between px-5 group/capsule overflow-hidden">
          {/* Subtle perimeter top scrubber bar */}
          <div className="absolute top-0 inset-x-8 h-[3px] bg-white/[0.08] rounded-full overflow-hidden group-hover/capsule:h-[5px] transition-all cursor-pointer">
            <div
              className="h-full bg-gradient-to-r from-brand-crimson via-brand-red to-brand-coral transition-all"
              style={{ width: `${progressPercent}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentDisplayTime}
              onChange={handleSliderChange}
              onMouseDown={handleSliderMouseDown}
              onMouseUp={handleSliderMouseUp}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              title="Avanzar / Retroceder canción"
            />
          </div>

          {/* Left: Disc Artwork & Song Details */}
          <div className="flex items-center gap-3.5 min-w-[200px] max-w-[280px]">
            <div
              onClick={onOpenLyrics}
              className="relative w-12 h-12 rounded-full overflow-hidden cursor-pointer shadow-lg flex-shrink-0 border border-white/20 group/art"
              title="Abrir vista completa y letras (F)"
            >
              <img
                src={currentSong.coverUrl}
                alt={currentSong.title}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
                }}
                className={`w-full h-full object-cover bg-zinc-800 ${
                  isPlaying ? 'animate-spin-slow' : ''
                }`}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/art:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="min-w-0 pr-1">
              <p
                onClick={onOpenLyrics}
                className="text-xs font-bold text-white truncate hover:text-brand-coral cursor-pointer transition-colors"
              >
                {currentSong.title}
              </p>
              <p
                onClick={() => onNavigateArtist?.(currentSong.artist)}
                className="text-[11px] text-zinc-400 truncate hover:text-white hover:underline cursor-pointer transition-colors"
              >
                {currentSong.artist}
              </p>
            </div>

            <button
              onClick={() => toggleLikeSong(currentSong)}
              className={`p-1.5 rounded-full hover:scale-110 transition-transform ${
                isLiked ? 'text-brand-coral' : 'text-zinc-400 hover:text-white'
              }`}
              title={isLiked ? 'Guardada en Me Gusta' : 'Añadir a Me Gusta'}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Center: Ergonomic Transport Controls & Time */}
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-3 sm:gap-5">
              {/* Shuffle */}
              <button
                onClick={toggleShuffle}
                className={`relative p-1.5 rounded-full transition-colors ${
                  isShuffle ? 'text-brand-coral' : 'text-zinc-400 hover:text-white'
                }`}
                title={
                  isShuffle
                    ? 'True Shuffle Activado: Distribución aleatoria real sin sesgos'
                    : 'Activar True Shuffle'
                }
              >
                <Shuffle className="w-3.5 h-3.5" />
                {isShuffle && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-coral rounded-full shadow-[0_0_8px_#ff3b24]" />
                )}
              </button>

              {/* Previous */}
              <button
                onClick={prevTrack}
                className="text-zinc-400 hover:text-white transition-colors p-1 hover:scale-110 active:scale-95"
                title="Anterior (Flecha izquierda)"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              {/* Main Play / Pause Circle */}
              <button
                onClick={togglePlay}
                disabled={isLoadingSong}
                className="w-11 h-11 rounded-full bg-gradient-to-tr from-brand-crimson to-brand-red hover:from-brand-red hover:to-brand-coral text-white flex items-center justify-center shadow-lg shadow-brand-red/35 hover:scale-105 active:scale-95 transition-all"
                title={isPlaying ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'}
              >
                {isLoadingSong ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4 fill-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                )}
              </button>

              {/* Next */}
              <button
                onClick={nextTrack}
                className="text-zinc-400 hover:text-white transition-colors p-1 hover:scale-110 active:scale-95"
                title="Siguiente (Flecha derecha)"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>

              {/* Repeat */}
              <button
                onClick={cycleRepeatMode}
                className={`relative p-1.5 rounded-full transition-colors ${
                  repeatMode !== 'off' ? 'text-brand-coral' : 'text-zinc-400 hover:text-white'
                }`}
                title={`Repetición: ${
                  repeatMode === 'off'
                    ? 'Desactivada'
                    : repeatMode === 'all'
                    ? 'Toda la lista'
                    : 'Canción actual'
                }`}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-3.5 h-3.5" />
                ) : (
                  <Repeat className="w-3.5 h-3.5" />
                )}
                {repeatMode !== 'off' && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-coral rounded-full" />
                )}
              </button>
            </div>

            {/* Time Indicators */}
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono mt-0.5">
              <span>{formatTime(currentDisplayTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Sound Tools & Volume */}
          <div className="flex items-center justify-end gap-2.5 min-w-[200px]">
            {/* Lyrics View Toggle */}
            <button
              onClick={onOpenLyrics}
              className={`p-2 rounded-2xl transition-all ${
                isLyricsOpen
                  ? 'text-brand-coral bg-brand-red/20 border border-brand-red/30 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
              title="Letras Karaoke en Vivo (F)"
            >
              <Mic2 className="w-4 h-4" />
            </button>

            {/* Queue Drawer Toggle */}
            <button
              onClick={onOpenQueue}
              className={`relative p-2 rounded-2xl transition-all ${
                isQueueOpen
                  ? 'text-brand-coral bg-brand-red/20 border border-brand-red/30 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
              title="Cola e historial de reproducción"
            >
              <ListMusic className="w-4 h-4" />
              {upcomingCount > 0 && (
                <span className="absolute -top-1 -right-1 text-[9px] bg-gradient-to-r from-brand-crimson to-brand-red text-white font-bold px-1 rounded-full shadow-sm shadow-brand-red/30">
                  {upcomingCount}
                </span>
              )}
            </button>

            {/* Equalizer & Audio Settings */}
            <button
              onClick={onOpenEqualizer}
              className="p-2 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Ecualizador, velocidad y temporizador"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Expandable Volume Slider */}
            <div
              onMouseEnter={() => setIsVolumeHovered(true)}
              onMouseLeave={() => setIsVolumeHovered(false)}
              className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.06] transition-all"
            >
              <button
                onClick={toggleMute}
                className="p-1 text-zinc-400 hover:text-white transition-colors"
                title={isMuted ? 'Activar sonido (M)' : 'Silenciar (M)'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-brand-coral" />
                ) : volume < 50 ? (
                  <Volume1 className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>

              <div
                className={`transition-all duration-300 overflow-hidden flex items-center ${
                  isVolumeHovered ? 'w-20 opacity-100 pr-1.5' : 'w-0 opacity-0 pointer-events-none'
                }`}
              >
                <div className="relative w-full h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer">
                  <div
                    className="h-full bg-brand-coral transition-all"
                    style={{ width: `${isMuted ? 0 : volume}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE FLOATING CAPSULE (< md)                                         */}
      {/* ========================================================================= */}
      <div className="md:hidden">
        <div
          onClick={() => setIsMobileExpanded(true)}
          className="fixed bottom-[72px] inset-x-3.5 h-[62px] bg-[#12131a]/95 backdrop-blur-2xl border border-white/[0.12] rounded-full z-40 flex items-center justify-between px-3.5 shadow-2xl cursor-pointer"
        >
          {/* Cover & Info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 flex-shrink-0 shadow">
              <img
                src={currentSong.coverUrl}
                alt={currentSong.title}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
                }}
                className={`w-full h-full object-cover bg-zinc-800 ${
                  isPlaying ? 'animate-spin-slow' : ''
                }`}
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{currentSong.title}</p>
              <p className="text-[11px] text-zinc-400 truncate">{currentSong.artist}</p>
            </div>
          </div>

          {/* Quick Play/Pause Action */}
          <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => toggleLikeSong(currentSong)}
              className={`p-1.5 rounded-full ${
                isLiked ? 'text-brand-coral' : 'text-zinc-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={togglePlay}
              disabled={isLoadingSong}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-crimson to-brand-red text-white flex items-center justify-center shadow-lg shadow-brand-red/35 active:scale-95 transition-transform"
            >
              {isLoadingSong ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white ml-0.5" />
              )}
            </button>
          </div>

          {/* Bottom perimeter progress arc */}
          <div className="absolute bottom-0 inset-x-6 h-[2px] bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-crimson via-brand-red to-brand-coral"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Mobile Zen Listening Sheet */}
        {isMobileExpanded && (
          <div className="fixed inset-0 z-50 bg-[#090b10] flex flex-col justify-between p-6 overflow-y-auto animate-fadeIn select-none">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsMobileExpanded(false)}
                className="p-2.5 rounded-full bg-white/10 text-zinc-300 hover:text-white"
              >
                <ChevronDown className="w-6 h-6" />
              </button>

              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-coral flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Aura Studio
                </span>
                <p className="text-xs font-semibold text-white truncate max-w-[200px]">
                  {currentSong.album || 'Free-Spoty'}
                </p>
              </div>

              <div className="w-10" />
            </div>

            {/* Giant Centered Vinyl Artwork */}
            <div className="my-auto py-6 flex flex-col items-center">
              <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-2xl border border-white/15 relative">
                <img
                  src={currentSong.coverUrl}
                  alt={currentSong.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
                  }}
                  className="w-full h-full object-cover bg-zinc-800"
                />
              </div>
            </div>

            {/* Track Info & Controls */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="min-w-0 pr-4">
                  <h2 className="text-2xl font-black text-white truncate">
                    {currentSong.title}
                  </h2>
                  <p
                    onClick={() => {
                      setIsMobileExpanded(false);
                      onNavigateArtist?.(currentSong.artist);
                    }}
                    className="text-sm font-medium text-zinc-400 truncate hover:text-white hover:underline cursor-pointer"
                  >
                    {currentSong.artist}
                  </p>
                </div>

                <button
                  onClick={() => toggleLikeSong(currentSong)}
                  className={`p-2.5 rounded-full bg-white/5 border border-white/10 ${
                    isLiked ? 'text-brand-coral' : 'text-zinc-400'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Scrubber */}
              <div className="space-y-1.5">
                <div className="relative flex items-center cursor-pointer py-2">
                  <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-crimson via-brand-red to-brand-coral"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.5}
                    value={currentDisplayTime}
                    onChange={handleSliderChange}
                    onMouseDown={handleSliderMouseDown}
                    onMouseUp={handleSliderMouseUp}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-6"
                  />
                </div>
                <div className="flex justify-between text-xs text-zinc-400 font-mono">
                  <span>{formatTime(currentDisplayTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Main Controls */}
              <div className="flex items-center justify-between py-2">
                <button
                  onClick={toggleShuffle}
                  className={`p-2.5 transition-colors ${
                    isShuffle ? 'text-brand-coral' : 'text-zinc-400'
                  }`}
                >
                  <Shuffle className="w-5 h-5" />
                </button>

                <button onClick={prevTrack} className="p-2 text-white hover:scale-110 active:scale-95">
                  <SkipBack className="w-7 h-7 fill-current" />
                </button>

                <button
                  onClick={togglePlay}
                  disabled={isLoadingSong}
                  className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-crimson to-brand-red text-white flex items-center justify-center shadow-2xl shadow-brand-red/40 active:scale-95 transition-transform"
                >
                  {isLoadingSong ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-8 h-8 fill-white" />
                  ) : (
                    <Play className="w-8 h-8 fill-white ml-1" />
                  )}
                </button>

                <button onClick={nextTrack} className="p-2 text-white hover:scale-110 active:scale-95">
                  <SkipForward className="w-7 h-7 fill-current" />
                </button>

                <button
                  onClick={cycleRepeatMode}
                  className={`p-2.5 transition-colors ${
                    repeatMode !== 'off' ? 'text-brand-coral' : 'text-zinc-400'
                  }`}
                >
                  {repeatMode === 'one' ? (
                    <Repeat1 className="w-5 h-5" />
                  ) : (
                    <Repeat className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Zen Sheet Tools */}
              <div className="flex items-center justify-around pt-3 border-t border-white/10">
                <button
                  onClick={() => {
                    setIsMobileExpanded(false);
                    onOpenLyrics();
                  }}
                  className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white px-3 py-2 rounded-xl bg-white/5"
                >
                  <Mic2 className="w-4 h-4 text-brand-coral" /> Letras
                </button>

                <button
                  onClick={() => {
                    setIsMobileExpanded(false);
                    onOpenQueue();
                  }}
                  className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white px-3 py-2 rounded-xl bg-white/5"
                >
                  <ListMusic className="w-4 h-4 text-brand-coral" /> Cola
                </button>

                <button
                  onClick={() => {
                    setIsMobileExpanded(false);
                    onOpenEqualizer();
                  }}
                  className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white px-3 py-2 rounded-xl bg-white/5"
                >
                  <Sliders className="w-4 h-4" /> Ajustes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
