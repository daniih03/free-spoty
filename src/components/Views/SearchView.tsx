import React, { useEffect, useState } from 'react';
import { Search, Play, Pause, Sparkles, Plus, ListPlus, Disc3, Radio } from 'lucide-react';
import { searchSongsMetadata, prefetchSong } from '../../services/searchService';
import { getCustomBackendUrl } from '../../services/config';
import { usePlayer, playerActions, useIsSongPlaying } from '../../state/player';
import { ui } from '../../state/ui';
import { formatTime } from '../../lib/format';
import { SongCard } from '../UI/SongCard';
import { Spinner, Vinyl } from '../UI/Primitives';
import { LikeButton } from '../Player/Controls';
import type { Song } from '../../types/music';

interface SearchViewProps {
  query: string;
  onSearchChange: (q: string) => void;
  onNavigateArtist: (artistName: string) => void;
}

const MOOD_PORTALS = [
  { name: 'Urbano & Fuego', desc: 'Reggaetón, Trap y ritmos nocturnos', gradient: 'from-brand-burgundy/80 via-brand-crimson/30 to-black', query: 'reggaeton latino' },
  { name: 'Estudio & Lo-Fi', desc: 'Beats analógicos para máxima concentración', gradient: 'from-[#1d1030]/80 via-brand-garnet/40 to-black', query: 'lofi chill' },
  { name: 'Pop & Vanguardia', desc: 'Los lanzamientos más escuchados del planeta', gradient: 'from-rose-950/70 via-brand-wine/30 to-black', query: 'pop hits' },
  { name: 'Rock & Distorsión', desc: 'Guitarras puras, solos y clásicos de culto', gradient: 'from-stone-900 via-brand-wine/40 to-black', query: 'rock classics' },
  { name: 'Noche Electrónica', desc: 'Synthwave, Melodic House & Techno', gradient: 'from-[#101a33]/80 via-brand-burgundy/30 to-black', query: 'electronic dance' },
  { name: 'Acústico & Madera', desc: 'Sesiones íntimas, guitarras y vocales', gradient: 'from-amber-950/60 via-brand-ruby/20 to-black', query: 'indie acoustic' },
];

/** Studio Stage: tarjeta panorámica del resultado principal con vinilo giratorio. */
function StudioStage({ song, queue, onNavigateArtist }: { song: Song; queue: Song[]; onNavigateArtist: (a: string) => void }) {
  const isCurrent = usePlayer((s) => s.currentSong?.id === song.id);
  const isPlaying = useIsSongPlaying(song.id);
  const play = () => (isCurrent ? playerActions.togglePlay() : playerActions.playSong(song, queue));
  const pill =
    'p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all text-xs flex items-center gap-1.5';

  return (
    <div className="relative rounded-3xl p-4 sm:p-6 md:p-8 bg-gradient-to-r from-brand-burgundy/30 via-[#131420]/90 to-[#0e1017]/80 border border-white/[0.1] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6 md:gap-8">
        <Vinyl
          src={song.coverUrl}
          size={400}
          isPlaying={isPlaying}
          onClick={play}
          holeClassName="w-8 h-8"
          title={isPlaying ? 'Pausar tema principal' : 'Reproducir tema principal'}
          className="group/vinyl w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 shadow-2xl border-2 border-white/20 ring-4 ring-black/50"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-0 group-hover/vinyl:opacity-100 flex items-center justify-center transition-all duration-200 z-20">
            <div className="w-12 h-12 rounded-full bg-brand-red text-white flex items-center justify-center shadow-lg shadow-brand-red/50">
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </div>
          </div>
        </Vinyl>

        <div className="flex-1 min-w-0 w-full text-center md:text-left space-y-3">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-red/20 border border-brand-red/40 text-[10px] font-extrabold uppercase tracking-wider text-brand-coral">
              Pista destacada
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">
              {formatTime(song.duration)} • {song.album || 'Sencillo'}
            </span>
          </div>

          <h3
            onClick={play}
            className="text-2xl md:text-4xl font-extrabold text-white tracking-tight truncate cursor-pointer hover:text-brand-coral transition-colors"
          >
            {song.title}
          </h3>
          <p
            onClick={() => onNavigateArtist(song.artist)}
            className="text-sm md:text-base text-zinc-300 font-medium truncate hover:underline hover:text-brand-rose cursor-pointer"
          >
            {song.artist}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <button
              onClick={play}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-brand-crimson via-brand-red to-brand-coral text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-red/30 hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              <span>{isPlaying ? 'Pausar' : 'Reproducir ahora'}</span>
            </button>
            <LikeButton
              song={song}
              className="p-2.5 rounded-full backdrop-blur-md border"
              activeClassName="bg-brand-burgundy/40 border-brand-red/50 text-brand-coral shadow-md"
              inactiveClassName="bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
            />
            <button onClick={() => ui.openAddToPlaylist(song)} className={pill} title="Añadir a playlist">
              <ListPlus className="w-4 h-4 text-brand-coral" />
              <span className="hidden sm:inline font-semibold">Playlist</span>
            </button>
            <button onClick={() => playerActions.addToQueue(song)} className={pill} title="Añadir a la cola">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline font-semibold">En cola</span>
            </button>
            <button onClick={() => onNavigateArtist(song.artist)} className={`${pill} hover:text-brand-coral`} title="Ir al perfil del artista">
              <Disc3 className="w-4 h-4" />
              <span className="hidden sm:inline font-semibold">Ver artista</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchView({ query, onSearchChange, onNavigateArtist }: SearchViewProps) {
  const [results, setResults] = useState<Song[]>([]);
  const [resultsFor, setResultsFor] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const trimmed = query.trim();

  useEffect(() => {
    if (!trimmed) {
      setResults([]);
      setResultsFor('');
      setIsSearching(false);
      return;
    }
    const controller = new AbortController();
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const songs = await searchSongsMetadata(trimmed, controller.signal);
        if (controller.signal.aborted) return;
        setResults(songs);
        setResultsFor(trimmed);
        setIsSearching(false);
        // El resultado principal es el clic más probable: se precarga en el servidor propio
        if (getCustomBackendUrl()) prefetchSong(songs[0]);
      } catch {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  const topResult = results[0];
  const hasResults = results.length > 0;

  return (
    <div className="w-full max-w-7xl mx-auto p-3.5 sm:p-4 md:p-8 space-y-6 md:space-y-8 min-w-0">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-coral animate-pulse" />
            <span className="text-[11px] uppercase tracking-widest font-bold text-brand-coral">Sonic Studio Explorer</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight truncate">
            {trimmed ? `Pistas para "${trimmed}"` : 'Exploración Sonora'}
          </h2>
        </div>
        {isSearching && hasResults && <Spinner className="w-5 h-5 border-2 border-brand-coral shrink-0 mb-1.5" />}
      </div>

      {!trimmed && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white/90 flex items-center gap-2">
              <Radio className="w-4 h-4 text-brand-coral" />
              Portales de Frecuencia
            </h3>
            <span className="text-xs text-white/40 hidden sm:inline">Selecciona un ambiente sonoro</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOOD_PORTALS.map((portal) => (
              <button
                key={portal.name}
                onClick={() => onSearchChange(portal.query)}
                className={`group relative text-left p-5 rounded-3xl bg-gradient-to-br ${portal.gradient} border border-white/[0.08] hover:border-brand-red/40 shadow-xl hover:shadow-2xl hover:shadow-brand-red/10 transition-all duration-300 transform-gpu hover:-translate-y-1 overflow-hidden`}
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
                <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full border border-white/[0.06] group-hover:border-brand-red/20 transition-colors pointer-events-none" />
              </button>
            ))}
          </div>
        </div>
      )}

      {trimmed && isSearching && !hasResults && (
        <div className="flex flex-col items-center justify-center py-20 space-y-3 text-zinc-400">
          <Spinner className="w-9 h-9 border-2 border-brand-coral" />
          <p className="text-xs font-medium tracking-wide text-zinc-300">Sintonizando catálogo oficial sin anuncios...</p>
        </div>
      )}

      {trimmed && !isSearching && !hasResults && resultsFor === trimmed && (
        <div className="p-10 sm:p-16 text-center text-zinc-500 space-y-3 bg-[#13141f]/30 rounded-3xl border border-white/5">
          <Search className="w-12 h-12 mx-auto opacity-30 text-brand-coral" />
          <p className="text-base font-semibold text-zinc-300">Sin coincidencias para "{trimmed}"</p>
          <p className="text-xs text-zinc-500">Verifica el nombre del artista o título de la canción e inténtalo de nuevo.</p>
        </div>
      )}

      {trimmed && hasResults && (
        <div className={`space-y-6 md:space-y-8 transition-opacity ${isSearching ? 'opacity-60' : ''}`}>
          {topResult && <StudioStage song={topResult} queue={results} onNavigateArtist={onNavigateArtist} />}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white/90">Catálogo coincidente ({results.length})</h3>
              <span className="text-xs text-white/40 hidden sm:inline">Audio de alta fidelidad sin anuncios</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {results.map((song) => (
                <SongCard key={song.id} song={song} contextQueue={results} onNavigateArtist={onNavigateArtist} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
