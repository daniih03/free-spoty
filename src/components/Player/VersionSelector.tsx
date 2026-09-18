import React from 'react';
import { VersionType } from '../../types/music';
import { usePlayer } from '../../context/PlayerContext';
import { Sparkles, FileText, Film } from 'lucide-react';

interface VersionSelectorProps {
  compact?: boolean;
}

export const VersionSelector: React.FC<VersionSelectorProps> = ({ compact = false }) => {
  const { activeVersion, switchActiveVersion, currentSong, isLoadingSong } = usePlayer();

  if (!currentSong) return null;

  const versions: { type: VersionType; label: string; shortLabel: string; icon: React.ReactNode; tooltip: string }[] = [
    {
      type: 'radio',
      label: 'YT Music Master',
      shortLabel: 'YT Music',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      tooltip: 'Audio de estudio oficial de YouTube Music sin intros ni cortes',
    },
    {
      type: 'lyrics',
      label: 'Lyrics',
      shortLabel: 'Letra',
      icon: <FileText className="w-3.5 h-3.5" />,
      tooltip: 'Audio directo de versión lyric video',
    },
    {
      type: 'original',
      label: 'Videoclip',
      shortLabel: 'Video',
      icon: <Film className="w-3.5 h-3.5" />,
      tooltip: 'Versión del videoclip oficial',
    },
  ];

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md transition-all ${
        compact ? 'scale-90' : ''
      }`}
      title="Prioridad de audio: YouTube Music (Estudio) > Lyrics > Videoclip"
    >
      <div className="flex items-center px-1.5 py-0.5 text-[10px] text-emerald-400 font-semibold tracking-wider uppercase border-r border-white/10 mr-1 hidden sm:flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-emerald-400" />
        Audio
      </div>
      {versions.map((ver) => {
        const isActive = activeVersion === ver.type;
        return (
          <button
            key={ver.type}
            disabled={isLoadingSong}
            onClick={() => switchActiveVersion(ver.type)}
            title={ver.tooltip}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 ${
              isActive
                ? 'bg-gradient-to-r from-brand-green to-emerald-500 text-black font-semibold shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            } ${isLoadingSong ? 'opacity-50 cursor-wait' : ''}`}
          >
            {ver.icon}
            <span>{compact ? ver.shortLabel : ver.label}</span>
          </button>
        );
      })}
    </div>
  );
};
