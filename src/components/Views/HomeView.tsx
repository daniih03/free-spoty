import React, { memo } from 'react';
import { Play, Radio, Shuffle, Mic2, Sliders, Flame, History } from 'lucide-react';
import { FEATURED_PLAYLISTS } from '../../services/exploreData';
import { useHistory } from '../../services/storageService';
import { playerActions, useIsSongPlaying } from '../../state/player';
import { getGreeting } from '../../lib/format';
import { SongCard } from '../UI/SongCard';
import { Cover, SoundBars } from '../UI/Primitives';
import type { Song } from '../../types/music';

interface HomeViewProps {
  onSelectPlaylist: (playlistId: string) => void;
  onNavigateArtist: (artistName: string) => void;
}

const QUICK_PICKS = FEATURED_PLAYLISTS.flatMap((p) => p.songs).slice(0, 6);

const FEATURES = [
  { icon: Radio, title: 'Audio Radio', desc: 'Sin intros de videoclip' },
  { icon: Shuffle, title: 'True Shuffle', desc: 'Aleatoriedad pura' },
  { icon: Mic2, title: 'Karaoke', desc: 'Letras sincronizadas' },
  { icon: Sliders, title: 'Ecualizador', desc: 'Presets & Sleep Timer' },
];

const QuickPick = memo(function QuickPick({ song, queue }: { song: Song; queue: Song[] }) {
  const isPlaying = useIsSongPlaying(song.id);
  return (
    <div
      onClick={() => playerActions.playSong(song, queue)}
      className="group flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] active:bg-white/[0.12] border border-white/[0.06] hover:border-brand-red/30 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:shadow-brand-red/5 touch-manipulation min-w-0"
    >
      <Cover src={song.coverUrl} size={120} alt={song.title} className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex-shrink-0 shadow-md" />
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-brand-coral transition-colors">
          {song.title}
        </p>
        <p className="text-[11px] sm:text-xs text-zinc-400 truncate">{song.artist}</p>
      </div>
      {isPlaying ? (
        <span className="mr-2 sm:mr-3">
          <SoundBars />
        </span>
      ) : (
        <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-brand-crimson to-brand-red text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 group-hover:scale-105 transition-all shadow-lg shadow-brand-red/30 mr-1 sm:mr-2 shrink-0">
          <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white ml-0.5" />
        </span>
      )}
    </div>
  );
});

export default function HomeView({ onSelectPlaylist, onNavigateArtist }: HomeViewProps) {
  const history = useHistory();
  const recent = history.slice(0, 6);

  return (
    <div className="w-full max-w-7xl mx-auto p-3.5 sm:p-4 md:p-8 space-y-6 md:space-y-10 min-w-0">
      {/* 1. Saludo + destacados */}
      <section className="min-w-0">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-2.5 sm:gap-3">
          <span>{getGreeting()}</span>
          <span className="text-brand-coral text-xl sm:text-2xl animate-pulse">✦</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Tu música favorita sin anuncios, con audio limpio de radio y letras en tiempo real.
        </p>

        <div className="mt-4 sm:mt-6 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="p-2.5 sm:p-3.5 rounded-2xl bg-gradient-to-br from-brand-red/15 via-brand-wine/10 to-transparent border border-brand-red/25 backdrop-blur-md flex items-center gap-2 sm:gap-3 min-w-0"
            >
              <div className="p-2 sm:p-2.5 rounded-xl bg-brand-red/20 text-brand-coral shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white truncate">{title}</h4>
                <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Escucha rápida / Reciente */}
      <section className="min-w-0">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
          {recent.length >= 3 ? (
            <>
              <History className="w-5 h-5 text-brand-coral shrink-0" />
              <span className="truncate">Escuchado recientemente</span>
            </>
          ) : (
            <>
              <Flame className="w-5 h-5 text-brand-coral shrink-0" />
              <span className="truncate">Escucha rápida recomendada</span>
            </>
          )}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {(recent.length >= 3 ? recent : QUICK_PICKS).map((song) => (
            <QuickPick key={song.id} song={song} queue={recent.length >= 3 ? history : QUICK_PICKS} />
          ))}
        </div>
      </section>

      {/* 3. Playlists destacadas */}
      {FEATURED_PLAYLISTS.map((playlist) => (
        <section key={playlist.id} className="space-y-3 sm:space-y-4 min-w-0 cv-auto">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="min-w-0 flex-1">
              <h3
                onClick={() => onSelectPlaylist(playlist.id)}
                className="text-lg sm:text-xl font-bold text-white hover:underline cursor-pointer truncate"
              >
                {playlist.name}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">{playlist.description}</p>
            </div>
            <button
              onClick={() => onSelectPlaylist(playlist.id)}
              className="text-xs font-semibold text-zinc-400 hover:text-brand-coral transition-colors shrink-0 whitespace-nowrap"
            >
              Ver todas ({playlist.songs.length})
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {playlist.songs.map((song) => (
              <SongCard key={song.id} song={song} contextQueue={playlist.songs} onNavigateArtist={onNavigateArtist} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
