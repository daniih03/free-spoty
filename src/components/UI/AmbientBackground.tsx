import React, { memo } from 'react';
import { usePlayer } from '../../state/player';
import { useDominantColor } from '../../hooks/useDominantColor';

/** Fondo Midnight Obsidian que se tiñe con el color dominante de la carátula. */
export const AmbientBackground = memo(function AmbientBackground() {
  const coverUrl = usePlayer((s) => s.currentSong?.coverUrl);
  const { primary, secondary } = useDominantColor(coverUrl);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#090b10]" aria-hidden>
      <div
        className="absolute inset-0 opacity-40 transition-[background-image] duration-1000"
        style={{
          backgroundImage: `radial-gradient(circle at 15% 15%, ${primary} 0%, transparent 45%), radial-gradient(circle at 85% 25%, ${secondary} 0%, transparent 50%), radial-gradient(circle at 50% 85%, ${primary} 0%, transparent 55%)`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#0a0a0e]/75 to-[#090b10]" />
    </div>
  );
});
