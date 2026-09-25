import React, { memo } from 'react';
import { usePlayer } from '../../state/player';
import { useDominantColor } from '../../hooks/useDominantColor';

/**
 * Fondo de laca: base burdeos casi negra + un halo del color de la carátula
 * que suena, que cambia con un fundido lento al cambiar de canción.
 */
export const AmbientBackground = memo(function AmbientBackground() {
  const coverUrl = usePlayer((s) => s.currentSong?.coverUrl);
  const { primary } = useDominantColor(coverUrl);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-ink" aria-hidden>
      <div
        className="absolute -top-[30%] left-[10%] w-[80%] h-[70%] rounded-full blur-[120px] opacity-[0.28] transition-colors duration-[1500ms]"
        style={{ backgroundColor: coverUrl ? primary : '#540900' }}
      />
      <div className="absolute -bottom-[35%] -right-[15%] w-[60%] h-[60%] rounded-full blur-[140px] opacity-[0.16] bg-brand-wine" />
    </div>
  );
});
