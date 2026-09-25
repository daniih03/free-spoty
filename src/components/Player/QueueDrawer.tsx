import React, { memo, useEffect, useState } from 'react';
import { X, Trash2, ListMusic, History, Play, Music, ChevronUp, ChevronDown } from 'lucide-react';
import { usePlayer, playerActions } from '../../state/player';
import { ui } from '../../state/ui';
import { useHistory } from '../../services/storageService';
import { Cover, SoundBars } from '../UI/Primitives';
import type { Song } from '../../types/music';

/** Cajón lateral de cola (reordenable) e historial. */
export default function QueueDrawer() {
  const currentSong = usePlayer((s) => s.currentSong);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const queue = usePlayer((s) => s.queue);
  const queueIndex = usePlayer((s) => s.queueIndex);
  const history = useHistory();
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && ui.closeQueue();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const upcoming = queue.slice(queueIndex + 1);

  const tabClass = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors active:scale-95 ${
      active
        ? 'bg-gradient-to-r from-brand-crimson to-brand-red text-white shadow-sm shadow-brand-red/20'
        : 'text-zinc-400 hover:text-white bg-white/5'
    }`;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 sm:bg-transparent" onClick={ui.closeQueue} />
      <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#121217]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col animate-slideLeft touch-manipulation">
        <div className="p-4 pt-[max(1rem,env(safe-area-inset-top,0px))] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveTab('queue')} className={tabClass(activeTab === 'queue')}>
              <ListMusic className="w-3.5 h-3.5" />
              Cola ({upcoming.length})
            </button>
            <button onClick={() => setActiveTab('history')} className={tabClass(activeTab === 'history')}>
              <History className="w-3.5 h-3.5" />
              Historial
            </button>
          </div>
          <button
            onClick={ui.closeQueue}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors active:scale-90"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] space-y-6">
          {activeTab === 'queue' ? (
            <>
              {currentSong && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Sonando ahora</h3>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-brand-red/10 border border-brand-red/30 shadow-md shadow-brand-red/5">
                    <Cover src={currentSong.coverUrl} size={96} alt="" className="w-12 h-12 rounded-lg shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-brand-coral truncate">{currentSong.title}</p>
                      <p className="text-xs text-zinc-400 truncate">{currentSong.artist}</p>
                    </div>
                    {isPlaying && <SoundBars className="h-4" />}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">A continuación</h3>
                  {upcoming.length > 0 && (
                    <button
                      onClick={playerActions.clearUpcomingQueue}
                      className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Vaciar cola
                    </button>
                  )}
                </div>

                {upcoming.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-xs">
                    <Music className="w-8 h-8 mx-auto mb-2 opacity-30 text-brand-coral" />
                    No hay más canciones en la cola. Añade canciones desde el menú de cualquier tarjeta o reproduce una
                    playlist.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {upcoming.map((song, i) => (
                      <QueueRow
                        key={`${song.id}-${queueIndex + 1 + i}`}
                        song={song}
                        position={i + 1}
                        index={queueIndex + 1 + i}
                        isFirst={i === 0}
                        isLast={i === upcoming.length - 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                Últimas {history.length} canciones reproducidas
              </h3>
              {history.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">Aún no has reproducido ninguna canción.</div>
              ) : (
                <div className="space-y-1">
                  {history.map((song: Song) => (
                    <div
                      key={song.id}
                      onClick={() => playerActions.playSong(song, history)}
                      className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      <Cover src={song.coverUrl} size={80} alt="" className="w-10 h-10 rounded-md shadow-sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate group-hover:text-brand-coral transition-colors">
                          {song.title}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate">{song.artist}</p>
                      </div>
                      <span className="p-1.5 rounded-full bg-gradient-to-tr from-brand-crimson to-brand-red text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 shadow-md shadow-brand-red/30 transition-all">
                        <Play className="w-3 h-3 fill-white ml-0.5" />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

const QueueRow = memo(function QueueRow({
  song,
  position,
  index,
  isFirst,
  isLast,
}: {
  song: Song;
  position: number;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };
  const iconBtn =
    'p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-all disabled:opacity-20 disabled:pointer-events-none';

  return (
    <div
      onClick={() => playerActions.playQueueIndex(index)}
      className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
      title="Reproducir ahora"
    >
      <span className="text-xs text-zinc-500 w-4 text-center tabular-nums">{position}</span>
      <Cover src={song.coverUrl} size={80} alt="" className="w-10 h-10 rounded-md" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate group-hover:text-brand-coral transition-colors">{song.title}</p>
        <p className="text-[11px] text-zinc-400 truncate">{song.artist}</p>
      </div>
      <div className="flex items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button onClick={stop(() => playerActions.moveInQueue(index, -1))} disabled={isFirst} className={iconBtn} title="Subir">
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button onClick={stop(() => playerActions.moveInQueue(index, 1))} disabled={isLast} className={iconBtn} title="Bajar">
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={stop(() => playerActions.removeFromQueue(index))}
          className={`${iconBtn} hover:text-red-400`}
          title="Quitar de la cola"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});
