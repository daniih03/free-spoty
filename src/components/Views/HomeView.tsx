import React from 'react';
import { FEATURED_PLAYLISTS } from '../../services/exploreData';
import { SongCard } from '../UI/SongCard';
import { usePlayer } from '../../context/PlayerContext';
import { Play, Sparkles, Radio, Shuffle, Mic2, Sliders, Flame } from 'lucide-react';
import { Song } from '../../types/music';

interface HomeViewProps {
  onSelectPlaylist: (playlistId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectPlaylist }) => {
  const { playSong } = usePlayer();

  // Dynamic greeting according to local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'Buenos días';
    if (hour >= 12 && hour < 20) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // First 6 songs for the top quick grid
  const quickPicks = FEATURED_PLAYLISTS.flatMap((p) => p.songs).slice(0, 6);

  return (
    <div className="p-6 md:p-8 space-y-10 max-w-7xl mx-auto select-none">
      {/* 1. Header Greeting & Feature Banner */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
          {getGreeting()}
          <span className="text-brand-green text-2xl animate-pulse">✦</span>
        </h1>
        <p className="text-sm text-zinc-400">
          Tu música favorita sin anuncios, con audio limpio de radio y letras en tiempo real.
        </p>

        {/* Feature Highlights Banner */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 backdrop-blur-md flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Audio Radio Edit</h4>
              <p className="text-[11px] text-zinc-400">Sin silencios ni intros de videoclips</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 backdrop-blur-md flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Shuffle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">True Shuffle Real</h4>
              <p className="text-[11px] text-zinc-400">Aleatoriedad pura sin sesgos</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 backdrop-blur-md flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
              <Mic2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Letras Sincronizadas</h4>
              <p className="text-[11px] text-zinc-400">Estilo Apple Music con salto interactivo</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 backdrop-blur-md flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Ecualizador & Timer</h4>
              <p className="text-[11px] text-zinc-400">Bass Boost y apagado automático</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Picks Grid (6 items) */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-brand-green" />
          Escucha rápida recomendada
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickPicks.map((song: Song) => (
            <div
              key={song.id}
              onClick={() => playSong(song, quickPicks)}
              className="group flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.06] hover:border-white/20 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
            >
              <img
                src={song.coverUrl}
                alt={song.title}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0 shadow-md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate group-hover:text-brand-green transition-colors">
                  {song.title}
                </p>
                <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
              </div>
              <button
                className="w-9 h-9 rounded-full bg-brand-green text-black flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all shadow-lg mr-2"
                title="Reproducir ahora"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Featured Playlists Carousels */}
      {FEATURED_PLAYLISTS.map((playlist) => (
        <div key={playlist.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3
                onClick={() => onSelectPlaylist(playlist.id)}
                className="text-xl font-bold text-white hover:underline cursor-pointer flex items-center gap-2"
              >
                {playlist.name}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">{playlist.description}</p>
            </div>

            <button
              onClick={() => onSelectPlaylist(playlist.id)}
              className="text-xs font-semibold text-zinc-400 hover:text-brand-green transition-colors"
            >
              Ver todas ({playlist.songs.length})
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {playlist.songs.map((song) => (
              <SongCard key={song.id} song={song} contextQueue={playlist.songs} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
