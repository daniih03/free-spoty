import React, { useState, useEffect, useRef } from 'react';
import { searchSongsMetadata } from '../../services/searchService';
import { Song } from '../../types/music';
import { SongCard } from '../UI/SongCard';
import { usePlayer } from '../../context/PlayerContext';
import {
  isSongLiked,
  toggleLikeSong,
  addSongToPlaylist,
  getCustomPlaylists,
} from '../../services/storageService';
import {
  Search,
  Play,
  Pause,
  Sparkles,
  Heart,
  Plus,
  MoreVertical,
  Disc3,
  LayoutList,
  LayoutGrid,
  Radio,
  Sliders,
  Check,
} from 'lucide-react';

interface SearchViewProps {
  query: string;
  onSearchChange: (q: string) => void;
  onNavigateArtist?: (artistName: string) => void;
}

const MOOD_PORTALS = [
  {
    name: 'Urbano & Fuego',
    desc: 'Reggaetón, Trap y ritmos nocturnos',
    gradient: 'from-brand-burgundy/80 via-brand-crimson/30 to-black',
    query: 'reggaeton latino',
  },
  {
    name: 'Estudio & Lo-Fi',
    desc: 'Beats analógicos para máxima concentración',
    gradient: 'from-purple-950/70 via-indigo-900/30 to-black',
    query: 'lofi chill',
  },
  {
    name: 'Pop & Vanguardia',
    desc: 'Los lanzamientos más escuchados del planeta',
    gradient: 'from-rose-950/70 via-pink-900/30 to-black',
    query: 'pop hits',
  },
  {
    name: 'Rock & Distorsión',
    desc: 'Guitarras puras, solos y clásicos de culto',
    gradient: 'from-stone-900 via-brand-wine/40 to-black',
    query: 'rock classics',
  },
  {
    name: 'Noche Electrónica',
    desc: 'Synthwave, Melodic House & Techno',
    gradient: 'from-blue-950/80 via-cyan-950/30 to-black',
    query: 'electronic dance',
  },
  {
    name: 'Acústico & Madera',
    desc: 'Sesiones íntimas, guitarras y vocales',
    gradient: 'from-amber-950/70 via-orange-950/30 to-black',
    query: 'indie',
  },
];

export const SearchView: React.FC<SearchViewProps> = ({
  query,
  onSearchChange,
  onNavigateArtist,
}) => {
  const { playSong, currentSong, isPlaying, togglePlay, addToQueue, playNextInQueue } = usePlayer();
  const [results, setResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'stream' | 'gallery'>('stream');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const customPlaylists = getCustomPlaylists();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const songs = await searchSongsMetadata(query, controller.signal);
        if (!controller.signal.aborted) {
          setResults(songs);
          setIsSearching(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const topResult = results[0];
  const remainingSongs = results.slice(1);

  const formatDuration = (sec: number) => {
    if (!sec || isNaN(sec)) return '3:20';
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto select-none">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-coral animate-pulse" />
            <span className="text-[11px] uppercase tracking-widest font-bold text-brand-coral">
              Sonic Studio Explorer
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {query.trim() ? `Pistas para "${query}"` : 'Exploración Sonora'}
          </h2>
        </div>

        {/* View Mode Switcher (When results are active) */}
        {results.length > 0 && (
          <div className="flex items-center gap-1 p-1 bg-[#141520]/80 border border-white/10 rounded-2xl self-start sm:self-auto backdrop-blur-md">
            <button
              onClick={() => setViewMode('stream')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === 'stream'
                  ? 'bg-gradient-to-r from-brand-crimson to-brand-red text-white shadow-md shadow-brand-red/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Vista Stream: doble canal ergonómico"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Stream</span>
            </button>
            <button
              onClick={() => setViewMode('gallery')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === 'gallery'
                  ? 'bg-gradient-to-r from-brand-crimson to-brand-red text-white shadow-md shadow-brand-red/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Vista Galería: vinilos y carátulas"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Galería</span>
            </button>
          </div>
        )}
      </div>

      {/* Mood Portals (Empty query) */}
      {!query.trim() && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white/90 flex items-center gap-2">
              <Radio className="w-4 h-4 text-brand-coral" />
              Portales de Frecuencia
            </h3>
            <span className="text-xs text-white/40">Selecciona un ambiente sonoro</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOOD_PORTALS.map((portal) => (
              <div
                key={portal.name}
                onClick={() => onSearchChange(portal.query)}
                className={`group relative p-5 rounded-3xl bg-gradient-to-br ${portal.gradient} border border-white/[0.08] hover:border-brand-red/40 shadow-xl hover:shadow-2xl hover:shadow-brand-red/10 cursor-pointer transition-all duration-300 transform-gpu hover:-translate-y-1 overflow-hidden`}
              >
                <div className="relative z-10 space-y-1">
                  <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-4 h-4 text-brand-coral" />
                  </div>
                  <h4 className="text-lg font-bold text-white tracking-tight group-hover:text-brand-coral transition-colors">
                    {portal.name}
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">{portal.desc}</p>
                </div>

                {/* Subtle decorative vinyl ring watermark */}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full border border-white/[0.06] group-hover:border-brand-red/20 transition-colors pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Searching Loader */}
      {isSearching && (
        <div className="flex flex-col items-center justify-center py-20 space-y-3 text-zinc-400">
          <div className="w-9 h-9 border-2 border-brand-coral border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium tracking-wide text-zinc-300">
            Sintonizando catálogo oficial sin anuncios...
          </p>
        </div>
      )}

      {/* Results View */}
      {!isSearching && query.trim() && (
        <>
          {results.length === 0 ? (
            <div className="p-16 text-center text-zinc-500 space-y-3 bg-[#13141f]/30 rounded-3xl border border-white/5">
              <Search className="w-12 h-12 mx-auto opacity-30 text-brand-coral" />
              <p className="text-base font-semibold text-zinc-300">
                Sin coincidencias para "{query}"
              </p>
              <p className="text-xs text-zinc-500">
                Verifica el nombre del artista o título de la canción e inténtalo de nuevo.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* ================================================================= */}
              {/* 1. STUDIO STAGE: Widescreen Panoramic Showcase for Lead Track     */}
              {/* ================================================================= */}
              {topResult && (
                <div className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-r from-brand-burgundy/30 via-[#131420]/90 to-[#0e1017]/80 border border-white/[0.1] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                    {/* Glowing Vinyl Disc Display */}
                    <div
                      onClick={() => playSong(topResult, results)}
                      className="group/vinyl relative w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden cursor-pointer shadow-2xl flex-shrink-0 border-2 border-white/20 ring-4 ring-black/50 bg-zinc-900 transform-gpu"
                      title={
                        currentSong?.id === topResult.id && isPlaying
                          ? 'Pausar tema principal'
                          : 'Reproducir tema principal'
                      }
                    >
                      <img
                        src={topResult.coverUrl}
                        alt={topResult.title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
                        }}
                        className={`w-full h-full object-cover transition-transform duration-500 rounded-full group-hover/vinyl:scale-105 ${
                          currentSong?.id === topResult.id && isPlaying ? 'animate-spin-slow' : ''
                        }`}
                      />

                      {/* Vinyl Center Spindle Hole */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="w-8 h-8 rounded-full bg-black/85 border border-white/25 flex items-center justify-center shadow-inner">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#131420] border border-white/40" />
                        </div>
                      </div>

                      {/* Glass center hover play badge */}
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-0 group-hover/vinyl:opacity-100 flex items-center justify-center transition-all duration-200 z-20">
                        <div className="w-12 h-12 rounded-full bg-brand-red text-white flex items-center justify-center shadow-lg shadow-brand-red/50 hover:scale-110 active:scale-95 transition-transform">
                          {currentSong?.id === topResult.id && isPlaying ? (
                            <Pause className="w-5 h-5 fill-white" />
                          ) : (
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex-1 min-w-0 text-center md:text-left space-y-3">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-brand-red/20 border border-brand-red/40 text-[10px] font-extrabold uppercase tracking-wider text-brand-coral">
                          Pista Destacada
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {formatDuration(topResult.duration)} • Audio HD Master
                        </span>
                      </div>

                      <h3
                        onClick={() => playSong(topResult, results)}
                        className="text-2xl md:text-4xl font-extrabold text-white tracking-tight truncate cursor-pointer hover:text-brand-coral transition-colors"
                      >
                        {topResult.title}
                      </h3>

                      <p
                        onClick={() => onNavigateArtist?.(topResult.artist)}
                        className={`text-sm md:text-base text-zinc-300 font-medium truncate ${
                          onNavigateArtist
                            ? 'hover:underline hover:text-brand-rose cursor-pointer'
                            : ''
                        }`}
                      >
                        {topResult.artist}
                      </p>

                      {/* Studio Action Bar */}
                      <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <button
                          onClick={() => {
                            if (currentSong?.id === topResult.id) {
                              togglePlay();
                            } else {
                              playSong(topResult, results);
                            }
                          }}
                          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-brand-crimson via-brand-red to-brand-coral text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-red/30 hover:scale-105 active:scale-95 transition-all"
                        >
                          {currentSong?.id === topResult.id && isPlaying ? (
                            <>
                              <Pause className="w-4 h-4 fill-white" />
                              <span>Pausar</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 fill-white ml-0.5" />
                              <span>Reproducir ahora</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => toggleLikeSong(topResult)}
                          className={`p-2.5 rounded-full backdrop-blur-md border transition-all ${
                            isSongLiked(topResult.id)
                              ? 'bg-brand-burgundy/40 border-brand-red/50 text-brand-coral shadow-md'
                              : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                          }`}
                          title="Me gusta"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              isSongLiked(topResult.id) ? 'fill-current' : ''
                            }`}
                          />
                        </button>

                        <button
                          onClick={() => addToQueue(topResult)}
                          className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all text-xs flex items-center gap-1.5"
                          title="Añadir a la cola"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="hidden sm:inline text-xs font-semibold">En cola</span>
                        </button>

                        {onNavigateArtist && (
                          <button
                            onClick={() => onNavigateArtist(topResult.artist)}
                            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-brand-coral transition-all text-xs flex items-center gap-1.5"
                            title="Ir al perfil del artista"
                          >
                            <Disc3 className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs font-semibold">
                              Ver artista
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* 2. AUDIO STREAM / GALLERY: Disposición No-Spotify                  */}
              {/* ================================================================= */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white/90">
                    Catálogo Coincidente ({results.length})
                  </h3>
                  <span className="text-xs text-white/40">Audio de alta fidelidad sin anuncios</span>
                </div>

                {viewMode === 'stream' ? (
                  /* Double-Channel Horizontal Stream Capsules */
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                    {results.map((song) => {
                      const isCurrent = currentSong?.id === song.id;
                      const isLiked = isSongLiked(song.id);
                      const isMenuOpen = activeMenuId === song.id;

                      return (
                        <div
                          key={song.id}
                          onClick={() => playSong(song, results)}
                          className={`group relative p-3 rounded-2xl backdrop-blur-xl transition-all duration-200 cursor-pointer flex items-center justify-between gap-3.5 border transform-gpu hover:-translate-y-0.5 ${
                            isCurrent
                              ? 'bg-brand-burgundy/30 border-brand-red/50 shadow-[0_4px_24px_rgba(200,25,0,0.18)]'
                              : 'bg-[#13141f]/50 hover:bg-[#191b29]/80 border-white/[0.06] hover:border-brand-red/35'
                          }`}
                        >
                          {/* Left: Cover with soundwave / play trigger */}
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="relative w-13 h-13 rounded-xl overflow-hidden flex-shrink-0 shadow-md bg-white/[0.03] border border-white/10">
                              <img
                                src={song.coverUrl}
                                alt={song.title}
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
                                }}
                                className="w-full h-full object-cover bg-zinc-800"
                              />

                              {/* Live Soundwave or Play Overlay */}
                              {isCurrent && isPlaying ? (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-0.5">
                                  <span className="w-0.5 h-3 bg-brand-coral rounded-full animate-pulse" />
                                  <span className="w-0.5 h-4 bg-brand-red rounded-full animate-pulse delay-75" />
                                  <span className="w-0.5 h-2.5 bg-brand-rose rounded-full animate-pulse delay-150" />
                                </div>
                              ) : (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <p
                                className={`text-sm font-semibold truncate transition-colors ${
                                  isCurrent ? 'text-brand-coral' : 'text-white/95 group-hover:text-white'
                                }`}
                              >
                                {song.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-white/45 truncate">
                                <span
                                  onClick={(e) => {
                                    if (onNavigateArtist) {
                                      e.stopPropagation();
                                      onNavigateArtist(song.artist);
                                    }
                                  }}
                                  className={
                                    onNavigateArtist
                                      ? 'hover:underline hover:text-brand-rose cursor-pointer'
                                      : ''
                                  }
                                >
                                  {song.artist}
                                </span>
                                {song.album && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate max-w-[140px] text-zinc-500">
                                      {song.album}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Quick actions & Duration */}
                          <div
                            className="flex items-center gap-1.5 flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-[11px] font-mono text-zinc-500 mr-1.5 hidden sm:inline">
                              {formatDuration(song.duration)}
                            </span>

                            <button
                              onClick={() => toggleLikeSong(song)}
                              className={`p-2 rounded-lg transition-colors ${
                                isLiked
                                  ? 'text-brand-coral'
                                  : 'text-zinc-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100'
                              }`}
                              title={isLiked ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                            >
                              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                            </button>

                            <button
                              onClick={() => addToQueue(song)}
                              className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-colors"
                              title="Añadir a la cola"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>

                            {/* Dropdown Menu */}
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setActiveMenuId(isMenuOpen ? null : song.id)
                                }
                                className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                                title="Opciones"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>

                              {isMenuOpen && (
                                <div className="absolute right-0 bottom-full mb-1.5 w-48 bg-[#161722]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-1.5 z-50 text-xs text-zinc-200 animate-fadeIn">
                                  {onNavigateArtist && (
                                    <button
                                      onClick={() => {
                                        onNavigateArtist(song.artist);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-3.5 py-2 hover:bg-white/10 flex items-center gap-2.5 text-white/90"
                                    >
                                      <Disc3 className="w-3.5 h-3.5 text-brand-coral" />
                                      Ver artista
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      playNextInQueue(song);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-white/10 flex items-center gap-2.5 text-white/90"
                                  >
                                    <Plus className="w-3.5 h-3.5 text-brand-coral" />
                                    Reproducir siguiente
                                  </button>

                                  <button
                                    onClick={() => {
                                      addToQueue(song);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-white/10 flex items-center gap-2.5 text-white/80"
                                  >
                                    <Plus className="w-3.5 h-3.5 text-zinc-400" />
                                    Añadir al final de la cola
                                  </button>

                                  {customPlaylists.length > 0 && (
                                    <div className="border-t border-white/10 my-1 pt-1">
                                      <div className="px-3.5 py-1 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                                        Añadir a playlist:
                                      </div>
                                      {customPlaylists.map((pl) => (
                                        <button
                                          key={pl.id}
                                          onClick={() => {
                                            addSongToPlaylist(pl.id, song);
                                            setActiveMenuId(null);
                                          }}
                                          className="w-full text-left px-3.5 py-1.5 hover:bg-white/10 text-xs text-white/80 hover:text-white truncate"
                                        >
                                          {pl.name}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Visual Gallery: Aura Minimalist Cards */
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {results.map((song) => (
                      <SongCard
                        key={song.id}
                        song={song}
                        contextQueue={results}
                        onNavigateArtist={onNavigateArtist}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
