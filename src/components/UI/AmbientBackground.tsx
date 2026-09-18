import React from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { useDominantColor } from '../../hooks/useDominantColor';

export const AmbientBackground: React.FC = () => {
  const { currentSong } = usePlayer();
  const { primary, secondary } = useDominantColor(currentSong?.coverUrl);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 transition-opacity duration-1000">
      {/* Dynamic flowing mesh gradients */}
      <div
        className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-25 mix-blend-screen transition-all duration-1000 animate-gradient-mesh"
        style={{ backgroundColor: primary }}
      />
      <div
        className="absolute top-[30%] -right-[15%] w-[50vw] h-[50vw] rounded-full blur-[140px] opacity-20 mix-blend-screen transition-all duration-1000 animate-gradient-mesh"
        style={{
          backgroundColor: secondary,
          animationDelay: '-5s',
        }}
      />
      <div
        className="absolute -bottom-[20%] left-[20%] w-[45vw] h-[45vw] rounded-full blur-[130px] opacity-15 mix-blend-screen transition-all duration-1000 animate-gradient-mesh"
        style={{
          backgroundColor: primary,
          animationDelay: '-10s',
        }}
      />

      {/* Subtle dark film overlay to ensure readable contrast */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-[60px]" />
    </div>
  );
};
