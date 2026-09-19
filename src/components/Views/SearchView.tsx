import React, { useState, useEffect, useRef } from 'react';
import { searchSongsMetadata } from '../../services/searchService';
import { Song } from '../../types/music';
import { SongCard } from '../UI/SongCard';
import { usePlayer } from '../../context/PlayerContext';
import { Search, Music, Play, Pause, Sparkles } from 'lucide-react';

interface SearchViewProps {
  query: string;
  onSearchChange: (q: string) => void;
  onNavigateArtist?: (artistName: string) => void;
}

const GENRE_CARDS = [
  { name: 'Pop Global', color: 'from-pink-600 to-rose-900', query: 'pop hits' },
  { name: 'Urbano Latino', color: 'from-amber-600 to-orange-900', query: 'reggaeton latino' },
  { name: 'Rock & Alternativo', color: 'from-red-600 to-stone-900', query: 'rock classics' },
  { name: 'Hip Hop & Trap', color: 'from-purple-600 to-indigo-950', query: 'hip hop' },
  { name: 'Lo-Fi Chill & Study', color: 'from-teal-600 to-emerald-950', query: 'lofi chill' },
  { name: 'Electrónica & Dance', color: 'from-cyan-600 to-blue-900', query: 'electronic dance' },
  { name: 'Indie & Acústico', color: 'from-emerald-600 to-teal-950', query: 'indie' },
  { name: 'Éxitos España', color: 'from-yellow-600 to-amber-900', query: 'exitos espana' },
];

export const SearchView: React.FC<SearchViewProps> = ({ query, onSearchChange, onNavigateArtist }) => {
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayer();
  const [results, setResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    // Cancel previous in-flight search request immediately
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

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto select-none">
      {/* Search Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
          {query.trim() ? `Resultados para "${query}"` : 'Explorar y Buscar'}
        </h2>
        <p className="text-xs text-zinc-400">
          Audio oficial en alta fidelidad sin anuncios ni interrupciones
        </p>
      </div>

      {/* Genre Categories when query is empty */}
      {!query.trim() && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-green" />
            Explorar por géneros
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {GENRE_CARDS.map((card) => (
              <div
                key={card.name}
                onClick={() => onSearchChange(card.query)}
                className={`group relative h-28 rounded-2xl bg-gradient-to-br ${card.color} p-4 cursor-pointer overflow-hidden border border-white/10 hover:border-white/25 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex items-end transform-gpu`}
              >
                <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-40 transition-opacity">
                  <Music className="w-12 h-12" />
                </div>
                <h4 className="text-base font-bold text-white tracking-tight drop-shadow-md z-10">
                  {card.name}
                </h4>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isSearching && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3 text-zinc-400">
          <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Buscando pistas oficiales en alta fidelidad...</p>
        </div>
      )}

      {/* Results view */}
      {!isSearching && query.trim() && (
        <>
          {results.length === 0 ? (
            <div className="p-16 text-center text-zinc-500 space-y-3">
              <Search className="w-12 h-12 mx-auto opacity-30 text-brand-green" />
              <p className="text-lg font-medium text-zinc-400">
                No encontramos resultados para "{query}"
              </p>
              <p className="text-xs text-zinc-500">
                Intenta buscar por el nombre del artista o título de la canción.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Top Result Spotlight */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {topResult && (
                  <div className="lg:col-span-5 space-y-3">
                    <h3 className="text-lg font-bold text-white">Resultado principal</h3>
                    <div
                      onClick={() => playSong(topResult, results)}
                      className="group p-6 rounded-3xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer relative shadow-xl transform-gpu"
                    >
                      <img
                        src={topResult.coverUrl}
                        alt={topResult.title}
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
                        }}
                        className="w-28 h-28 rounded-2xl object-cover shadow-2xl mb-4 group-hover:scale-105 transition-transform bg-zinc-800"
                      />
                      <h4 className="text-2xl font-black text-white truncate mb-1 group-hover:text-brand-green transition-colors">
                        {topResult.title}
                      </h4>
                      <p
                        onClick={(e) => {
                          if (onNavigateArtist) {
                            e.stopPropagation();
                            onNavigateArtist(topResult.artist);
                          }
                        }}
                        className={`text-sm text-zinc-400 font-medium mb-3 ${
                          onNavigateArtist ? 'hover:underline hover:text-white cursor-pointer' : ''
                        }`}
                      >
                        {topResult.artist}
                      </p>

                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-white/10 text-white/90 border border-white/15 px-3 py-1 rounded-full font-semibold">
                          Canción
                        </span>
                      </div>

                      {/* Always Visible Spotify Play Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (currentSong?.id === topResult.id) {
                            togglePlay();
                          } else {
                            playSong(topResult, results);
                          }
                        }}
                        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-2xl shadow-black/70 hover:scale-105 active:scale-95 transition-transform duration-200 z-10"
                        title={currentSong?.id === topResult.id && isPlaying ? 'Pausar' : 'Reproducir'}
                      >
                        {currentSong?.id === topResult.id && isPlaying ? (
                          <Pause className="w-6 h-6 fill-black text-black" />
                        ) : (
                          <Play className="w-6 h-6 fill-black text-black ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Top 5 Songs List */}
                <div className="lg:col-span-7 space-y-3">
                  <h3 className="text-lg font-bold text-white">Canciones</h3>
                  <div className="space-y-1">
                    {results.slice(0, 5).map((song) => (
                      <div
                        key={song.id}
                        onClick={() => playSong(song, results)}
                        className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={song.coverUrl}
                            alt={song.title}
                            loading="lazy"
                            className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate group-hover:text-brand-green">
                              {song.title}
                            </p>
                            <p
                              onClick={(e) => {
                                if (onNavigateArtist) {
                                  e.stopPropagation();
                                  onNavigateArtist(song.artist);
                                }
                              }}
                              className={`text-xs text-zinc-400 truncate ${
                                onNavigateArtist ? 'hover:underline hover:text-white cursor-pointer' : ''
                              }`}
                            >
                              {song.artist}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs text-zinc-500 font-mono">
                            {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                          </span>
                          <button
                            className="p-2 rounded-full text-zinc-400 group-hover:text-white group-hover:bg-white/10 transition-colors"
                            title="Reproducir"
                          >
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid of all results */}
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-bold text-white">Todas las canciones encontradas</h3>
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
