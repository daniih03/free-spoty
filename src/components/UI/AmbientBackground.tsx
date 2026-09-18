import React from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { useDominantColor } from '../../hooks/useDominantColor';

export const AmbientBackground: React.FC = () => {
  const { currentSong } = usePlayer();
  const { primary, secondary } = useDominantColor(currentSong?.coverUrl);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* High performance CSS gradient mesh without heavy continuous blur repainting */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 transform-gpu opacity-35"
        style={{
          backgroundImage: `
            radial-gradient(circle at 10% 20%, ${primary} 0%, transparent 40%),
            radial-gradient(circle at 90% 30%, ${secondary} 0%, transparent 45%),
            radial-gradient(circle at 50% 80%, ${primary} 0%, transparent 50%)
          `,
          backgroundColor: '#0a0a0c',
        }}
      />
      {/* Vignette film overlay for optimal contrast and battery efficiency */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/80 to-black pointer-events-none" />
    </div>
  );
};
