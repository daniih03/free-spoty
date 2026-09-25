import React, { useEffect, useState } from 'react';
import { SearchX, Play, Pause, ListPlus } from 'lucide-react';
import { searchSongsMetadata, prefetchSong } from '../../services/searchService';
import { activeBackend } from '../../services/serverStatus';
import { FEATURED_PLAYLISTS } from '../../services/exploreData';
import { usePlayer, playerActions, useIsSongPlaying } from '../../state/player';
import { ui } from '../../state/ui';
import { SongCard } from '../UI/SongCard';
import { TrackRow } from '../UI/TrackRow';
import { Record, Sleeve } from '../UI/Primitives';
import { LikeButton } from '../Player/Controls';
import type { Song } from '../../types/music';

interface SearchViewProps {
  query: string;
  onSearchChange: (q: string) => void;
  onNavigateArtist: (artistName: string) => void;
}

const COVERS = FEATURED_PLAYLISTS.flatMap((p) => p.songs.map((s) => s.coverUrl));

/** Géneros de arranque: cada uno con su tono dentro de la gama burdeos-latón. */
const GENRES = [
  { name: 'Urbano', hint: 'Reggaetón, trap y dembow', query: 'reggaeton', from: '#8E0F00', to: '#3A0700', cover: COVERS[6] },
  { name: 'Pop', hint: 'Lo que más suena en el mundo', query: 'pop hits', from: '#B23A48', to: '#3B0D16', cover: COVERS[0] },
  { name: 'Rock', hint: 'Guitarras y clásicos de culto', query: 'rock classics', from: '#5B4636', to: '#1E1511', cover: COVERS[12] },
  { name: 'Lo-fi', hint: 'Para concentrarte', query: 'lofi chill', from: '#4A3558', to: '#18101E', cover: COVERS[16] },
  { name: 'Electrónica', hint: 'House, techno y synthwave', query: 'electronic dance', from: '#2F3E63', to: '#0F1422', cover: COVERS[2] },
  { name: 'Acústico', hint: 'Sesiones íntimas', query: 'indie acoustic', from: '#9A7440', to: '#2E2112', cover: COVERS[18] },
];

function GenreTile({ genre, onPick }: { genre: (typeof GENRES)[number]; onPick: (q: string) => void }) {
  return (
    <button
      onClick={() => onPick(genre.query)}
      className="group relative h-36 md:h-44 rounded-2xl overflow-hidden text-left p-5 isolate"
      style={{ background: `linear-gradient(135deg, ${genre.from}, ${genre.to})` }}
    >
      <span className="relative z-10 block font-display text-[28px] md:text-[34px] font-extrabold tracking-tight text-paper leading-none">
        {genre.name}
      </span>
      <span className="relative z-10 block text-[13px] text-paper/70 mt-2 max-w-[60%]">{genre.hint}</span>
      <Record
        src={genre.cover}
        size={120}
        isPlaying={false}
        className="absolute -right-6 -bottom-8 w-32 h-32 md:w-40 md:h-40 rotate-12 transition-transform duration-700 ease-out group-hover:rotate-[48deg] group-hover:-translate-y-2 group-hover:-translate-x-2"
      />
    </button>
  );
}

/** Resultado principal: funda grande de la que sale el vinilo mientras suena. */
function TopResult({ song, queue, onNavigateArtist }: { song: Song; queue: Song[]; onNavigateArtist: (a: string) => void }) {
  const isCurrent = usePlayer((s) => s.currentSong?.id === song.id);
  const isPlaying = useIsSongPlaying(song.id);
  const play = () => (isCurrent ? playerActions.togglePlay() : playerActions.playSong(song, queue));

  return (
    <div className="group sleeve-peek relative rounded-2xl bg-paper/[0.05] hover:bg-paper/[0.08] transition-colors p-5 md:p-6 min-w-0 overflow-hidden">
      <Sleeve
        src={song.coverUrl}
        size={300}
        isPlaying={isPlaying}
        slide="45%"
        onClick={play}
        coverClassName="rounded-lg"
        className="w-28 h-28 md:w-32 md:h-32"
        alt={song.title}
      />
      <h3 className="font-display text-[28px] md:text-[34px] leading-tight font-bold text-paper tracking-tight mt-5 truncate">
        {song.title}
      </h3>
      <div className="flex items-center gap-2 mt-1 text-[14px] min-w-0">
        <button onClick={() => onNavigateArtist(song.artist)} className="text-paper/85 hover:underline truncate">
          {song.artist}
        </button>
        {song.album && <span className="text-faint truncate">{song.album}</span>}
      </div>
      <div className="flex items-center gap-2 mt-5">
        <button
          onClick={play}
          className="h-12 pl-5 pr-6 rounded-full bg-brand-red hover:bg-brand-lightred text-paper font-semibold text-[14px] flex items-center gap-2 transition-colors active:scale-95"
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" strokeWidth={0} /> : <Play className="w-5 h-5 fill-current" strokeWidth={0} />}
          {isPlaying ? 'Pausar' : 'Reproducir'}
        </button>
        <LikeButton song={song} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-paper/[0.07]" iconClassName="w-5 h-5" />
        <button
          onClick={() => ui.openAddToPlaylist(song)}
          className="w-12 h-12 flex items-center justify-center rounded-full text-mute hover:text-paper hover:bg-paper/[0.07] transition-colors"
          title="Añadir a una playlist"
        >
          <ListPlus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 animate-pulse">
      <div className="h-[300px] rounded-2xl bg-paper/[0.05]" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-3 py-2">
            <div className="w-11 h-11 rounded-md bg-paper/[0.07]" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/2 rounded bg-paper/[0.07]" />
              <div className="h-3 w-1/3 rounded bg-paper/[0.05]" />
            </div>
          </div>
        ))}
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
        if (activeBackend()) prefetchSong(songs[0]);
      } catch {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  const hasResults = results.length > 0;
  const [top, ...rest] = results;

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 pt-2 md:pt-6 pb-8 min-w-0">
      {!trimmed && (
        <section>
          <h1 className="font-display text-display-lg font-extrabold text-paper">Explorar</h1>
          <p className="text-[15px] text-mute mt-2">Elige un estilo o busca cualquier canción o artista.</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mt-8 stagger">
            {GENRES.map((g) => (
              <GenreTile key={g.name} genre={g} onPick={onSearchChange} />
            ))}
          </div>
        </section>
      )}

      {trimmed && isSearching && !hasResults && <ResultsSkeleton />}

      {trimmed && !isSearching && !hasResults && resultsFor === trimmed && (
        <div className="py-20 text-center max-w-md mx-auto">
          <SearchX className="w-10 h-10 mx-auto text-faint" />
          <p className="font-display text-2xl font-bold text-paper mt-4">Nada para “{trimmed}”</p>
          <p className="text-[14px] text-mute mt-2">Revisa cómo está escrito o prueba solo con el nombre del artista.</p>
        </div>
      )}

      {trimmed && hasResults && top && (
        <div className={`space-y-12 transition-opacity duration-300 ${isSearching ? 'opacity-50' : ''}`}>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-6 lg:gap-8">
            <section className="min-w-0">
              <h2 className="font-display text-[22px] font-bold text-paper mb-4">Mejor resultado</h2>
              <TopResult song={top} queue={results} onNavigateArtist={onNavigateArtist} />
            </section>
            <section className="min-w-0">
              <h2 className="font-display text-[22px] font-bold text-paper mb-3">Canciones</h2>
              <div className="-mx-2 md:-mx-3">
                {rest.slice(0, 5).map((song) => (
                  <TrackRow key={song.id} song={song} contextQueue={results} onNavigateArtist={onNavigateArtist} />
                ))}
              </div>
            </section>
          </div>

          {rest.length > 5 && (
            <section className="min-w-0">
              <h2 className="font-display text-[22px] font-bold text-paper mb-5">Más resultados</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-x-5 gap-y-7">
                {rest.slice(5).map((song) => (
                  <SongCard key={song.id} song={song} contextQueue={results} onNavigateArtist={onNavigateArtist} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
