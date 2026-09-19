import React, { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { getPlayHistory } from '../../services/storageService';
import { Song } from '../../types/music';
import { X, Trash2, ListMusic, History, Play, Music } from 'lucide-react';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({ isOpen, onClose }) => {
  const {
    currentSong,
    queue,
    queueIndex,
    removeFromQueue,
    clearUpcomingQueue,
    playSong,
  } = usePlayer();

  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const historySongs = getPlayHistory();

  if (!isOpen) return null;

  const upcomingSongs = queue.slice(queueIndex + 1);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#121212]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col transition-transform duration-300 animate-slideLeft">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeTab === 'queue'
                ? 'bg-gradient-to-r from-brand-crimson to-brand-red text-white shadow-sm shadow-brand-red/20'
                : 'text-zinc-400 hover:text-white bg-white/5'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            Cola ({upcomingSongs.length})
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-brand-crimson to-brand-red text-white shadow-sm shadow-brand-red/20'
                : 'text-zinc-400 hover:text-white bg-white/5'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Historial
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
        {activeTab === 'queue' ? (
          <>
            {/* Now Playing section */}
            {currentSong && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Sonando Ahora
                </h3>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-brand-red/10 border border-brand-red/30 shadow-md shadow-brand-red/5">
                  <img
                    src={currentSong.coverUrl}
                    alt={currentSong.title}
                    className="w-12 h-12 rounded-lg object-cover shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brand-coral truncate">
                      {currentSong.title}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">{currentSong.artist}</p>
                  </div>
                  {/* Equalizer mini animation */}
                  <div className="flex items-end gap-0.5 h-4 w-4">
                    <span className="w-1 bg-brand-coral h-full animate-pulse" />
                    <span className="w-1 bg-brand-coral h-2/3 animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1 bg-brand-coral h-4/5 animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming Queue */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  A continuación
                </h3>
                {upcomingSongs.length > 0 && (
                  <button
                    onClick={clearUpcomingQueue}
                    className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-red-400 transition-colors"
                    title="Vaciar la cola restante (Queja #1 resuelta)"
                  >
                    <Trash2 className="w-3 h-3" />
                    Vaciar cola
                  </button>
                )}
              </div>

              {upcomingSongs.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  <Music className="w-8 h-8 mx-auto mb-2 opacity-30 text-brand-coral" />
                  No hay más canciones en la cola. Añade canciones con el menú contextual o reproduce una playlist.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {upcomingSongs.map((song, idx) => {
                    const actualIndex = queueIndex + 1 + idx;
                    return (
                      <div
                        key={`${song.id}-${actualIndex}`}
                        className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <span className="text-xs text-zinc-500 w-4 text-center">{idx + 1}</span>
                        <img
                          src={song.coverUrl}
                          alt={song.title}
                          className="w-10 h-10 rounded-md object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate group-hover:text-brand-coral transition-colors">
                            {song.title}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate">{song.artist}</p>
                        </div>
                        <button
                          onClick={() => removeFromQueue(actualIndex)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-red-400 transition-all"
                          title="Eliminar de la cola"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          /* History Tab */
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              Últimas 50 canciones reproducidas
            </h3>
            {historySongs.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                Aún no has reproducido ninguna canción.
              </div>
            ) : (
              <div className="space-y-1.5">
                {historySongs.map((song: Song, idx: number) => (
                  <div
                    key={`${song.id}-history-${idx}`}
                    onClick={() => playSong(song)}
                    className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="w-10 h-10 rounded-md object-cover shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate group-hover:text-brand-coral transition-colors">
                        {song.title}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">{song.artist}</p>
                    </div>
                    <button
                      className="p-1.5 rounded-full bg-gradient-to-tr from-brand-crimson to-brand-red hover:from-brand-red hover:to-brand-coral text-white opacity-0 group-hover:opacity-100 shadow-md shadow-brand-red/30 transition-all"
                      title="Reproducir de nuevo"
                    >
                      <Play className="w-3 h-3 fill-white ml-0.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
