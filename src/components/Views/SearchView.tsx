import React, { useState, useEffect, useRef } from 'react';
import { searchSongsMetadata } from '../../services/searchService';
import { Song } from '../../types/music';
import { SongCard } from '../UI/SongCard';
import { usePlayer } from '../../context/PlayerContext';
import { isSongLiked, toggleLikeSong } from '../../services/storageService';
import {
  Search,
  Play,
  Pause,
  Sparkles,
  Heart,
  Plus,
  ListPlus,
  Disc3,
  Radio,
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
  const { playSong, currentSong, isPlaying, togglePlay, addToQueue, openAddToPlaylistModal } = usePlayer();
  const [results, setResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

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
    <div className="w-full max-w-full overflow-x-hidden p-3.5 sm:p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto select-none">
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
            <div className="space-y-6 md:space-y-8">
              {/* ================================================================= */}
              {/* 1. STUDIO STAGE: Widescreen Panoramic Showcase for Lead Track     */}
              {/* ================================================================= */}
              {topResult && (
                <div className="relative rounded-3xl p-4 sm:p-6 md:p-8 bg-gradient-to-r from-brand-burgundy/30 via-[#131420]/90 to-[#0e1017]/80 border border-white/[0.1] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6 md:gap-8">
                    {/* Glowing Vinyl Disc Display */}
                    <div
                      onClick={() => playSong(topResult, results)}
                      className="group/vinyl relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full overflow-hidden cursor-pointer shadow-2xl flex-shrink-0 border-2 border-white/20 ring-4 ring-black/50 bg-zinc-900 transform-gpu"
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
                          onClick={() => openAddToPlaylistModal(topResult)}
                          className="p-2.5 rounded-full backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all text-xs flex items-center gap-1.5"
                          title="Añadir a playlist"
                        >
                          <ListPlus className="w-4 h-4 text-brand-coral" />
                          <span className="hidden sm:inline text-xs font-semibold">Playlist</span>
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
              {/* 2. CATÁLOGO EN MODO GALERÍA                                       */}
              {/* ================================================================= */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white/90">
                    Catálogo Coincidente ({results.length})
                  </h3>
                  <span className="text-xs text-white/40">Audio de alta fidelidad sin anuncios</span>
                </div>

                {/* Visual Gallery: Aura Minimalist Cards */}
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
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
