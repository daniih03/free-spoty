import React from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { useDominantColor } from '../../hooks/useDominantColor';

export const AmbientBackground: React.FC = () => {
  const { currentSong } = usePlayer();
  const { primary, secondary } = useDominantColor(currentSong?.coverUrl);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* High performance CSS gradient mesh with obsidian midnight undertone */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 transform-gpu opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 15%, ${primary} 0%, transparent 45%),
            radial-gradient(circle at 85% 25%, ${secondary} 0%, transparent 50%),
            radial-gradient(circle at 50% 85%, ${primary} 0%, transparent 55%)
          `,
          backgroundColor: '#090b10',
        }}
      />
      {/* Vignette film overlay for optimal contrast and zero visual fatigue */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#0a0a0e]/75 to-[#090b10] pointer-events-none" />
    </div>
  );
};
