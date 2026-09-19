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
  VolumeX,
  Volume1,
  Mic2,
  ListMusic,
  Sliders,
  Heart,
  Maximize2,
  ChevronDown,
} from 'lucide-react';

interface BottomPlayerProps {
  onOpenLyrics: () => void;
  onOpenQueue: () => void;
  onOpenEqualizer: () => void;
  isLyricsOpen: boolean;
  isQueueOpen: boolean;
  onNavigateArtist?: (artistName: string) => void;
}

export const BottomPlayer: React.FC<BottomPlayerProps> = ({
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
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

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
      {/* 1. DESKTOP VIEW (md: and up) - 100% UNTOUCHED ORIGINAL DESKTOP DESIGN     */}
      {/* ========================================================================= */}
      <footer className="hidden md:flex fixed bottom-0 inset-x-0 h-24 bg-[#121212]/90 backdrop-blur-2xl border-t border-white/10 px-4 md:px-6 z-40 items-center justify-between transition-all select-none">
        {/* Track Info (Left) */}
        <div className="flex items-center gap-3 w-1/4 min-w-[180px]">
          <div
            onClick={onOpenLyrics}
            className="relative group w-14 h-14 rounded-xl overflow-hidden cursor-pointer shadow-lg flex-shrink-0"
            title="Abrir letras y vista completa (F)"
          >
            <img
              src={currentSong.coverUrl}
              alt={currentSong.title}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
              }}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 bg-zinc-800"
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
            <p
              onClick={() => onNavigateArtist?.(currentSong.artist)}
              className="text-xs text-zinc-400 truncate hover:text-white hover:underline cursor-pointer transition-colors"
            >
              {currentSong.artist}
            </p>
          </div>

          <button
            onClick={() => toggleLikeSong(currentSong)}
            className={`p-1.5 rounded-full hover:scale-110 transition-transform ${
              isLiked ? 'text-brand-coral' : 'text-zinc-400 hover:text-white'
            }`}
            title={isLiked ? 'Eliminar de canciones que te gustan' : 'Añadir a canciones que te gustan'}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Controls & Progress Bar (Center) */}
        <div className="flex flex-col items-center max-w-xl w-2/4 px-2">
          {/* Playback Buttons */}
          <div className="flex items-center gap-4 sm:gap-6 mb-1.5">
            {/* True Shuffle Button */}
            <button
              onClick={toggleShuffle}
              className={`relative p-1.5 rounded-full transition-colors ${
                isShuffle ? 'text-brand-coral' : 'text-zinc-400 hover:text-white'
              }`}
              title={
                isShuffle
                  ? 'True Shuffle Activado: Distribución 100% aleatoria sin repeticiones de Spotify'
                  : 'Activar True Shuffle'
              }
            >
              <Shuffle className="w-4 h-4" />
              {isShuffle && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-coral rounded-full shadow-[0_0_8px_#ff3b24]" />
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
                repeatMode !== 'off' ? 'text-brand-coral' : 'text-zinc-400 hover:text-white'
              }`}
              title={`Repetición: ${repeatMode === 'off' ? 'Desactivada' : repeatMode === 'all' ? 'Toda la lista' : 'Canción actual'}`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              {repeatMode !== 'off' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-coral rounded-full" />
              )}
            </button>
          </div>

          {/* Progress scrub line */}
          <div className="w-full flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
            <span className="w-8 text-right">{formatTime(currentDisplayTime)}</span>
            <div className="relative flex-1 group flex items-center cursor-pointer">
              <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden group-hover:h-1.5 transition-all">
                <div
                  className="h-full bg-white group-hover:bg-brand-coral transition-all"
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
                onTouchStart={handleSliderMouseDown}
                onTouchEnd={handleSliderMouseUp}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-4"
              />
            </div>
            <span className="w-8 text-left">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Extra Tools & Volume (Right) */}
        <div className="flex items-center justify-end gap-3 w-1/4 min-w-[200px]">
          <button
            onClick={onOpenLyrics}
            className={`p-2 rounded-full transition-colors ${
              isLyricsOpen ? 'text-brand-coral bg-brand-red/15 shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
            title="Letras sincronizadas Apple Music (F)"
          >
            <Mic2 className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenQueue}
            className={`relative p-2 rounded-full transition-colors ${
              isQueueOpen ? 'text-brand-coral bg-brand-red/15 shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
            title="Cola de reproducción e historial"
          >
            <ListMusic className="w-4 h-4" />
            {upcomingCount > 0 && (
              <span className="absolute -top-1 -right-1 text-[9px] bg-gradient-to-r from-brand-crimson to-brand-red text-white font-bold px-1 rounded-full shadow-sm shadow-brand-red/30">
                {upcomingCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenEqualizer}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Ecualizador, velocidad y temporizador"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Volume slider */}
          <div className="flex items-center gap-1.5 w-28 group">
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
                  className="h-full bg-white group-hover:bg-brand-coral transition-colors"
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

      {/* ========================================================================= */}
      {/* 2. MOBILE VIEW (< md) - SPOTIFY STYLE MINI-PLAYER + EXPANDED FULLSCREEN   */}
      {/* ========================================================================= */}
      <div className="md:hidden">
        {/* Floating Mini Player above the bottom navigation */}
        <div
          onClick={() => setIsMobileExpanded(true)}
          className="fixed bottom-[68px] inset-x-2 h-14 bg-[#18181c]/95 backdrop-blur-xl border border-white/10 rounded-2xl z-30 flex items-center justify-between px-3 shadow-2xl cursor-pointer"
        >
          {/* Cover & Title/Artist */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
            <img
              src={currentSong.coverUrl}
              alt={currentSong.title}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
              }}
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0 shadow bg-zinc-800"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {currentSong.title}
              </p>
              <p
                onClick={(e) => {
                  if (onNavigateArtist) {
                    e.stopPropagation();
                    onNavigateArtist(currentSong.artist);
                  }
                }}
                className="text-[11px] text-zinc-400 truncate hover:text-white hover:underline cursor-pointer"
              >
                {currentSong.artist}
              </p>
            </div>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => toggleLikeSong(currentSong)}
              className={`p-2 rounded-full transition-colors ${
                isLiked ? 'text-brand-coral' : 'text-zinc-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={togglePlay}
              disabled={isLoadingSong}
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center active:scale-90 transition-transform"
            >
              {isLoadingSong ? (
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>
          </div>

          {/* Thin bottom progress line */}
          <div className="absolute bottom-0 inset-x-3 h-[2px] bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-crimson via-brand-red to-brand-coral"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Mobile Fullscreen Player Sheet */}
        {isMobileExpanded && (
          <div className="fixed inset-0 z-50 bg-[#0e0e12] flex flex-col justify-between p-6 overflow-y-auto animate-fadeIn select-none">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsMobileExpanded(false)}
                className="p-2 rounded-full bg-white/10 text-zinc-300"
              >
                <ChevronDown className="w-6 h-6" />
              </button>

              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Sonando Ahora
                </span>
                <p className="text-xs font-semibold text-white truncate max-w-[200px]">
                  {currentSong.album || 'Free-Spoty'}
                </p>
              </div>

              <div className="w-10" />
            </div>

            {/* Big Centered Album Art */}
            <div className="my-auto py-4 flex flex-col items-center">
              <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <img
                  src={currentSong.coverUrl}
                  alt={currentSong.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
                  }}
                  className="w-full h-full object-cover bg-zinc-800"
                />
              </div>
            </div>

            {/* Song Meta & Heart */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 pr-4">
                  <h2 className="text-xl font-extrabold text-white truncate">
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
                  className={`p-2 rounded-full ${
                    isLiked ? 'text-brand-coral' : 'text-zinc-400'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Scrubber */}
              <div className="space-y-1">
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
                    onTouchStart={handleSliderMouseDown}
                    onTouchEnd={handleSliderMouseUp}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-6"
                  />
                </div>
                <div className="flex justify-between text-xs text-zinc-400 font-mono">
                  <span>{formatTime(currentDisplayTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Main Playback Controls */}
              <div className="flex items-center justify-between py-2">
                <button
                  onClick={toggleShuffle}
                  className={`p-2 transition-colors ${
                    isShuffle ? 'text-brand-coral' : 'text-zinc-400'
                  }`}
                >
                  <Shuffle className="w-5 h-5" />
                </button>

                <button onClick={prevTrack} className="p-2 text-white">
                  <SkipBack className="w-7 h-7 fill-current" />
                </button>

                <button
                  onClick={togglePlay}
                  disabled={isLoadingSong}
                  className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-xl active:scale-95 transition-transform"
                >
                  {isLoadingSong ? (
                    <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-8 h-8 fill-current" />
                  ) : (
                    <Play className="w-8 h-8 fill-current ml-1" />
                  )}
                </button>

                <button onClick={nextTrack} className="p-2 text-white">
                  <SkipForward className="w-7 h-7 fill-current" />
                </button>

                <button
                  onClick={cycleRepeatMode}
                  className={`p-2 transition-colors ${
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

              {/* Extra Tools */}
              <div className="flex items-center justify-end pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsMobileExpanded(false);
                      onOpenLyrics();
                    }}
                    className={`p-2 rounded-full ${
                      isLyricsOpen ? 'text-brand-coral' : 'text-zinc-400'
                    }`}
                    title="Letras"
                  >
                    <Mic2 className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileExpanded(false);
                      onOpenQueue();
                    }}
                    className={`p-2 rounded-full ${
                      isQueueOpen ? 'text-brand-coral' : 'text-zinc-400'
                    }`}
                    title="Cola"
                  >
                    <ListMusic className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileExpanded(false);
                      onOpenEqualizer();
                    }}
                    className="p-2 rounded-full text-zinc-400"
                    title="Ajustes"
                  >
                    <Sliders className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
