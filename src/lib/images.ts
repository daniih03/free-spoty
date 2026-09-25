import type { SyntheticEvent } from 'react';

export const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';

export const DEFAULT_PLAYLIST_COVER =
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

/**
 * Devuelve la carátula al tamaño que realmente se pinta (en px CSS × DPR ≈ size).
 * Apple (mzstatic) y Unsplash sirven cualquier tamaño: pedir 120px para una
 * miniatura de 48px ahorra ~95% de bytes frente a la versión 600x600.
 */
export function artwork(url: string | undefined, size: number): string {
  if (!url) return FALLBACK_COVER;
  if (url.includes('mzstatic.com')) {
    return url.replace(/\/\d+x\d+bb\.(jpg|png|webp)$/, `/${size}x${size}bb.$1`);
  }
  if (url.includes('images.unsplash.com')) {
    return url.replace(/([?&])w=\d+/, `$1w=${size}`);
  }
  return url;
}

/** Manejador onError universal: evita marcos negros o alt-text roto (Regla de Oro nº3). */
export function onImageError(e: SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.dataset.fallback) return;
  img.dataset.fallback = '1';
  img.src = FALLBACK_COVER;
}
