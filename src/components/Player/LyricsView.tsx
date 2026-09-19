import React, { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { isSongLiked, toggleLikeSong } from '../../services/storageService';
import {
  X,
  Mic2,
  Music,
  Sparkles,
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
  ListPlus,
  Disc3,
  Sliders,
} from 'lucide-react';

interface LyricsViewProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateArtist?: (artistName: string) => void;
}

export const LyricsView: React.FC<LyricsViewProps> = ({
  isOpen,
  onClose,
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
    togglePlay,
    seek,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
    syncedLyrics,
    isLoadingLyrics,
    openAddToPlaylistModal,
  } = usePlayer();

  const [showLyrics, setShowLyrics] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Keyboard shortcut ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Determine current active lyric line index
  let activeIndex = -1;
  if (syncedLyrics && syncedLyrics.length > 0) {
    for (let i = 0; i < syncedLyrics.length; i++) {
      if (currentTime >= syncedLyrics[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }
  }

  // Smooth auto-scroll to active lyric line
  useEffect(() => {
    if (showLyrics && activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, showLyrics]);

  if (!isOpen || !currentSong) return null;

  const isLiked = isSongLiked(currentSong.id);
  const currentDisplayTime = isSeeking ? seekValue : currentTime;
  const progressPercent = duration > 0 ? (currentDisplayTime / duration) * 100 : 0;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

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
    <div className="fixed inset-0 z-50 flex flex-col bg-[#090b10]/95 backdrop-blur-3xl text-white select-none transition-all duration-500 animate-fadeIn overflow-hidden">
      {/* Dynamic ambient backdrop illumination */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brand-burgundy/20 rounded-full blur-[140px] opacity-60" />
        <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] bg-brand-crimson/15 rounded-full blur-[120px] opacity-40" />
      </div>

      {/* Top Header Bar */}
      <div className="relative z-20 flex items-center justify-between px-6 md:px-10 py-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-brand-coral shadow-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">
              Aura Studio Visor
            </h2>
            <p className="text-[11px] text-zinc-500 font-medium">
              Audio HD Master • Reproducción a Pantalla Completa
            </p>
          </div>
        </div>

        {/* Center Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-white/[0.06] border border-white/10 rounded-2xl backdrop-blur-xl shadow-lg">
          <button
            onClick={() => setShowLyrics(false)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              !showLyrics
                ? 'bg-gradient-to-r from-brand-crimson to-brand-red text-white shadow-md shadow-brand-red/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Visor de Estudio
          </button>
          <button
            onClick={() => setShowLyrics(true)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              showLyrics
                ? 'bg-gradient-to-r from-brand-crimson to-brand-red text-white shadow-md shadow-brand-red/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Mic2 className="w-3.5 h-3.5" />
            <span>Ver Letra</span>
          </button>
        </div>

        {/* Close Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/[0.06] hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white transition-all shadow-md hover:scale-105 active:scale-95"
            title="Cerrar pantalla completa (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area: Centered Visor OR Split Visor + Lyrics */}
      <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-10 flex items-center justify-center">
        {!showLyrics ? (
          /* ========================================================================= */
          /* MODE 1: GRAND CENTERED STUDIO PLAYER VISOR                                */
          /* ========================================================================= */
          <div className="w-full max-w-2xl flex flex-col items-center justify-center text-center space-y-6 animate-fadeIn my-auto py-4">
            {/* Grand Spinning Vinyl Record with authentic spindle hole & grooves */}
            <div className="relative group/vinyl flex items-center justify-center">
              {/* Outer atmospheric halo */}
              <div className="absolute inset-0 bg-brand-red/15 rounded-full blur-3xl transform scale-110 pointer-events-none" />

              <div
                onClick={togglePlay}
                className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] border-4 border-white/20 ring-4 ring-black/80 bg-zinc-950 cursor-pointer transform-gpu"
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                <img
                  src={currentSong.coverUrl}
                  alt={currentSong.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
                  }}
                  className={`w-full h-full object-cover transition-transform duration-700 ${
                    isPlaying ? 'animate-spin-slow' : ''
                  }`}
                />

                {/* Concentric Vinyl Grooves Watermark */}
                <div className="absolute inset-4 rounded-full border border-white/10 pointer-events-none" />
                <div className="absolute inset-10 rounded-full border border-white/[0.06] pointer-events-none" />
                <div className="absolute inset-20 rounded-full border border-white/[0.04] pointer-events-none" />

                {/* Authentic Vinyl Center Spindle Hole */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="w-14 h-14 rounded-full bg-black/90 border-2 border-white/30 flex items-center justify-center shadow-2xl">
                    <div className="w-4 h-4 rounded-full bg-[#101119] border border-white/40" />
                  </div>
                </div>

                {/* Hover Play/Pause Overlay */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover/vinyl:opacity-100 flex items-center justify-center transition-opacity z-20">
                  <div className="w-16 h-16 rounded-full bg-brand-red text-white flex items-center justify-center shadow-2xl shadow-brand-red/50 transform group-hover/vinyl:scale-110 active:scale-95 transition-transform">
                    {isPlaying ? (
                      <Pause className="w-7 h-7 fill-white" />
                    ) : (
                      <Play className="w-7 h-7 fill-white ml-1" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Song Metadata */}
            <div className="space-y-2 pt-2 max-w-xl">
              <div className="flex items-center justify-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-brand-red/20 border border-brand-red/40 text-[10px] font-black uppercase tracking-wider text-brand-coral">
                  Master Studio HD
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  {currentSong.album || 'Audio Oficial'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {currentSong.title}
              </h1>

              <p
                onClick={() => {
                  if (onNavigateArtist) {
                    onClose();
                    onNavigateArtist(currentSong.artist);
                  }
                }}
                className={`text-base sm:text-xl text-zinc-300 font-semibold ${
                  onNavigateArtist
                    ? 'hover:text-brand-coral hover:underline cursor-pointer transition-colors'
                    : ''
                }`}
              >
                {currentSong.artist}
              </p>
            </div>

            {/* Precision Grand Scrubber Bar */}
            <div className="w-full max-w-lg space-y-2 pt-2">
              <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 select-none">
                <span className="w-10 text-right text-white/80 font-mono">
                  {formatTime(currentDisplayTime)}
                </span>

                <div className="group/scrub relative flex-1 h-2 hover:h-3 bg-white/10 rounded-full overflow-hidden cursor-pointer transition-all">
                  <div
                    className="h-full bg-gradient-to-r from-brand-crimson via-brand-red to-brand-coral rounded-full relative"
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
                    title="Avanzar o retroceder"
                  />
                </div>

                <span className="w-10 text-left text-zinc-500 font-mono">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Grand Transport Deck Controls */}
            <div className="flex items-center justify-center gap-6 sm:gap-8 pt-1">
              <button
                onClick={toggleShuffle}
                className={`p-2.5 rounded-full transition-colors ${
                  isShuffle ? 'text-brand-coral' : 'text-zinc-400 hover:text-white'
                }`}
                title="True Shuffle"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={prevTrack}
                className="text-zinc-300 hover:text-white transition-transform p-2 hover:scale-110 active:scale-95"
                title="Canción anterior"
              >
                <SkipBack className="w-6 h-6 fill-current" />
              </button>

              <button
                onClick={togglePlay}
                disabled={isLoadingSong}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-crimson via-brand-red to-brand-coral text-white flex items-center justify-center shadow-2xl shadow-brand-red/50 hover:scale-108 active:scale-95 transition-all"
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isLoadingSong ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-7 h-7 fill-white" />
                ) : (
                  <Play className="w-7 h-7 fill-white ml-1" />
                )}
              </button>

              <button
                onClick={nextTrack}
                className="text-zinc-300 hover:text-white transition-transform p-2 hover:scale-110 active:scale-95"
                title="Siguiente canción"
              >
                <SkipForward className="w-6 h-6 fill-current" />
              </button>

              <button
                onClick={cycleRepeatMode}
                className={`p-2.5 rounded-full transition-colors ${
                  repeatMode !== 'off' ? 'text-brand-coral' : 'text-zinc-400 hover:text-white'
                }`}
                title="Modo repetición"
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-5 h-5" />
                ) : (
                  <Repeat className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Bottom Actions Row: Favorite, Lyrics Trigger, Volume */}
            <div className="flex items-center justify-center gap-4 pt-3 flex-wrap">
              <button
                onClick={() => toggleLikeSong(currentSong)}
                className={`p-3 rounded-2xl border transition-all ${
                  isLiked
                    ? 'bg-brand-burgundy/40 border-brand-red/50 text-brand-coral shadow-lg'
                    : 'bg-white/[0.05] border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
                title="Me gusta"
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={() => openAddToPlaylistModal(currentSong)}
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

              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.05] border border-white/10">
                <button
                  onClick={toggleMute}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-brand-coral" />
                  ) : volume < 50 ? (
                    <Volume1 className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <div className="relative w-24 h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer">
                  <div
                    className="h-full bg-brand-coral"
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
        ) : (
          /* ========================================================================= */
          /* MODE 2: SPLIT SCREEN (VISOR ON LEFT + SYNCED LYRICS ON RIGHT)             */
          /* ========================================================================= */
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full animate-fadeIn">
            {/* Left: Studio Visor (Scaled for Split Layout) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center text-center space-y-4 p-4">
              {/* Spinning Vinyl */}
              <div
                onClick={togglePlay}
                className="relative w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 rounded-full overflow-hidden shadow-2xl border-4 border-white/20 ring-4 ring-black/80 bg-zinc-950 cursor-pointer transform-gpu group/vsplit"
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                <img
                  src={currentSong.coverUrl}
                  alt={currentSong.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
                  }}
                  className={`w-full h-full object-cover ${
                    isPlaying ? 'animate-spin-slow' : ''
                  }`}
                />

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="w-10 h-10 rounded-full bg-black/90 border border-white/30 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-[#101119] border border-white/40" />
                  </div>
                </div>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/vsplit:opacity-100 flex items-center justify-center transition-opacity z-20">
                  <div className="w-12 h-12 rounded-full bg-brand-red text-white flex items-center justify-center shadow-lg">
                    {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                  </div>
                </div>
              </div>

              {/* Title & Artist */}
              <div className="space-y-1 max-w-sm">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                  {currentSong.title}
                </h3>
                <p
                  onClick={() => {
                    if (onNavigateArtist) {
                      onClose();
                      onNavigateArtist(currentSong.artist);
                    }
                  }}
                  className={`text-sm text-zinc-400 font-medium truncate ${
                    onNavigateArtist ? 'hover:underline hover:text-white cursor-pointer' : ''
                  }`}
                >
                  {currentSong.artist}
                </p>
              </div>

              {/* Scrubber */}
              <div className="w-full max-w-xs flex items-center gap-2 text-[11px] font-mono select-none">
                <span className="w-8 text-right text-zinc-400">{formatTime(currentDisplayTime)}</span>
                <div className="relative flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer">
                  <div
                    className="h-full bg-gradient-to-r from-brand-crimson to-brand-coral rounded-full"
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
                  />
                </div>
                <span className="w-8 text-left text-zinc-500">{formatTime(duration)}</span>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={prevTrack}
                  className="text-zinc-300 hover:text-white p-1 hover:scale-110 active:scale-95"
                >
                  <SkipBack className="w-5 h-5 fill-current" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-crimson to-brand-red text-white flex items-center justify-center shadow-lg shadow-brand-red/40 hover:scale-108 active:scale-95 transition-all"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                </button>

                <button
                  onClick={nextTrack}
                  className="text-zinc-300 hover:text-white p-1 hover:scale-110 active:scale-95"
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>

                <button
                  onClick={() => toggleLikeSong(currentSong)}
                  className={`p-2 rounded-full ${
                    isLiked ? 'text-brand-coral' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                </button>
              </div>

              <button
                onClick={() => setShowLyrics(false)}
                className="text-xs text-zinc-400 hover:text-white underline pt-1"
              >
                Volver al visor completo
              </button>
            </div>

            {/* Right: Synchronized Karaoke Lyrics Stream */}
            <div
              ref={containerRef}
              className="lg:col-span-7 h-[65vh] overflow-y-auto pr-4 space-y-6 scrollbar-none select-none text-left py-20"
              style={{ scrollBehavior: 'smooth' }}
            >
              {isLoadingLyrics ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-3">
                  <div className="w-8 h-8 border-2 border-brand-coral border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm">Sincronizando letra con la pista...</p>
                </div>
              ) : syncedLyrics && syncedLyrics.length > 0 ? (
                syncedLyrics.map((line, idx) => {
                  const isActive = idx === activeIndex;
                  const isPast = idx < activeIndex;

                  return (
                    <div
                      key={`${line.time}-${idx}`}
                      ref={isActive ? activeLineRef : null}
                      onClick={() => seek(line.time)}
                      className={`group cursor-pointer transition-all duration-300 rounded-2xl px-5 py-2.5 ${
                        isActive
                          ? 'text-white text-2xl md:text-4xl font-black scale-[1.03] bg-brand-burgundy/30 shadow-xl shadow-brand-red/10 border-l-4 border-brand-coral pl-6'
                          : isPast
                          ? 'text-zinc-500 text-lg md:text-2xl font-semibold opacity-50 hover:opacity-100 hover:text-zinc-300'
                          : 'text-zinc-400 text-lg md:text-2xl font-semibold opacity-75 hover:opacity-100 hover:text-white'
                      }`}
                    >
                      <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
                        {line.text}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
                  <Music className="w-12 h-12 opacity-40 text-brand-coral" />
                  <p className="text-lg font-medium text-zinc-300">
                    Pista instrumental o letra no disponible
                  </p>
                  <p className="text-xs text-zinc-500 max-w-sm text-center">
                    Disfruta del audio en alta fidelidad y la consola de estudio.
                  </p>
                  <button
                    onClick={() => setShowLyrics(false)}
                    className="px-5 py-2 rounded-full bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
                  >
                    Ver visor de estudio
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
