import React, { useState, useEffect } from 'react';
import { searchSongsMetadata } from '../../services/searchService';
import { Song } from '../../types/music';
import { SongCard } from '../UI/SongCard';
import { usePlayer } from '../../context/PlayerContext';
import { Search, Music, Play, Sparkles, Radio } from 'lucide-react';

interface SearchViewProps {
  query: string;
  onSearchChange: (q: string) => void;
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

export const SearchView: React.FC<SearchViewProps> = ({ query, onSearchChange }) => {
  const { playSong } = usePlayer();
  const [results, setResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const songs = await searchSongsMetadata(query);
        setResults(songs);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const topResult = results[0];
  const otherResults = results.slice(1);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto select-none">
      {/* Search Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
          {query.trim() ? `Resultados para "${query}"` : 'Explorar y Buscar'}
        </h2>
        <p className="text-xs text-zinc-400">
          Obtén canciones limpias directamente desde YouTube con letras sincronizadas
        </p>
      </div>

      {/* When NO query is entered: Show Genre Category Cards */}
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
                className={`group relative h-28 rounded-2xl bg-gradient-to-br ${card.color} p-4 cursor-pointer overflow-hidden border border-white/10 hover:border-white/25 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-end`}
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

      {/* Loading state */}
      {isSearching && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3 text-zinc-400">
          <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Buscando las mejores versiones de audio...</p>
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
                Intenta buscar por el nombre del artista, canción o prueba con otro término.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Top Result + Top Songs split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Top Result Spotlight Card */}
                {topResult && (
                  <div className="lg:col-span-5 space-y-3">
                    <h3 className="text-lg font-bold text-white">Resultado principal</h3>
                    <div
                      onClick={() => playSong(topResult, results)}
                      className="group p-6 rounded-3xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer relative shadow-xl"
                    >
                      <img
                        src={topResult.coverUrl}
                        alt={topResult.title}
                        className="w-28 h-28 rounded-2xl object-cover shadow-2xl mb-4 group-hover:scale-105 transition-transform"
                      />
                      <h4 className="text-2xl font-black text-white truncate mb-1 group-hover:text-brand-green transition-colors">
                        {topResult.title}
                      </h4>
                      <p className="text-sm text-zinc-400 font-medium mb-3">{topResult.artist}</p>
                      
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-medium">
                          <Radio className="w-3 h-3" /> Radio Edit Priorizada
                        </span>
                      </div>

                      <button
                        className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-brand-green text-black flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all"
                        title="Reproducir ahora"
                      >
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Right: Top 4 songs list */}
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
                            className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate group-hover:text-brand-green">
                              {song.title}
                            </p>
                            <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
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
                    <SongCard key={song.id} song={song} contextQueue={results} />
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
