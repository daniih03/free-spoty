import React, { memo } from 'react';
import { Play } from 'lucide-react';
import { FEATURED_PLAYLISTS } from '../../services/exploreData';
import { useHistory } from '../../services/storageService';
import { playerActions, useIsSongPlaying } from '../../state/player';
import { getGreeting } from '../../lib/format';
import { SongCard } from '../UI/SongCard';
import { PlaylistSleeve } from '../UI/PlaylistSleeve';
import { Cover, SoundBars } from '../UI/Primitives';
import type { Song } from '../../types/music';

interface HomeViewProps {
  onSelectPlaylist: (playlistId: string) => void;
  onNavigateArtist: (artistName: string) => void;
}

const STARTERS = FEATURED_PLAYLISTS.flatMap((p) => p.songs.slice(0, 2)).slice(0, 6);

/** Acceso rápido: carátula + título, a lo ancho. */
const QuickTile = memo(function QuickTile({ song, queue }: { song: Song; queue: Song[] }) {
  const isPlaying = useIsSongPlaying(song.id);
  return (
    <button
      onClick={() => playerActions.playSong(song, queue)}
      className="group flex items-center gap-3 h-14 pr-3 rounded-lg bg-paper/[0.06] hover:bg-paper/[0.11] overflow-hidden text-left transition-colors min-w-0"
    >
      <Cover src={song.coverUrl} size={112} alt="" className="w-14 h-14 shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block text-[14px] font-semibold text-paper truncate">{song.title}</span>
        <span className="block text-[12px] text-mute truncate">{song.artist}</span>
      </span>
      {isPlaying ? (
        <SoundBars className="h-4 text-brand-coral shrink-0 mr-1" />
      ) : (
        <span className="w-8 h-8 shrink-0 rounded-full bg-brand-red text-paper flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
          <Play className="w-3.5 h-3.5 fill-current translate-x-[1px]" strokeWidth={0} />
        </span>
      )}
    </button>
  );
});

function SectionHeader({ title, detail, onMore }: { title: string; detail?: string; onMore?: () => void }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4 md:mb-5">
      <div className="min-w-0">
        <h2 className="font-display text-display-md font-bold text-paper truncate">{title}</h2>
        {detail && <p className="text-[14px] text-mute mt-1 truncate">{detail}</p>}
      </div>
      {onMore && (
        <button onClick={onMore} className="text-[13px] font-semibold text-mute hover:text-paper transition-colors shrink-0 pb-1">
          Ver todo
        </button>
      )}
    </div>
  );
}

export default function HomeView({ onSelectPlaylist, onNavigateArtist }: HomeViewProps) {
  const history = useHistory();
  const hasHistory = history.length >= 3;
  const tiles = hasHistory ? history.slice(0, 6) : STARTERS;

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 pt-4 md:pt-8 pb-8 space-y-12 md:space-y-16 min-w-0">
      {/* Bienvenida: única coreografía de entrada de la app */}
      <section className="stagger min-w-0">
        <h1 className="font-display text-display-xl font-extrabold text-paper">{getGreeting()}</h1>
        <p className="text-[15px] md:text-[17px] text-mute mt-3 max-w-xl">
          {hasHistory ? 'Retoma lo último que escuchaste.' : 'Empieza por algo de lo que suena ahora mismo.'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-3 mt-7 md:mt-9">
          {tiles.map((song) => (
            <QuickTile key={song.id} song={song} queue={tiles} />
          ))}
        </div>
      </section>

      {/* Playlists como fundas de disco */}
      <section className="min-w-0">
        <SectionHeader title="Listas para empezar" detail="Seleccionadas a mano, sin anuncios de por medio." />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-5 gap-y-8">
          {FEATURED_PLAYLISTS.map((pl) => (
            <PlaylistSleeve key={pl.id} playlist={pl} onOpen={onSelectPlaylist} />
          ))}
        </div>
      </section>

      {/* Estanterías de canciones */}
      {FEATURED_PLAYLISTS.map((playlist) => (
        <section key={playlist.id} className="min-w-0 cv-auto">
          <SectionHeader
            title={playlist.name}
            detail={playlist.description}
            onMore={() => onSelectPlaylist(playlist.id)}
          />
          <div className="shelf px-2 -mx-2">
            {playlist.songs.map((song) => (
              <SongCard key={song.id} song={song} contextQueue={playlist.songs} onNavigateArtist={onNavigateArtist} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
