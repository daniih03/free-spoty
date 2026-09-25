import { useEffect, useState } from 'react';
import { artwork } from '../lib/images';

interface ColorResult {
  primary: string;
  secondary: string;
  /** Canales "r, g, b" para componer rgba(). */
  rgb: string;
}

const DEFAULT_RESULT: ColorResult = {
  primary: 'rgb(84, 9, 0)', // Burdeos de la marca
  secondary: 'rgb(54, 5, 0)',
  rgb: '84, 9, 0',
};

const colorCache = new Map<string, ColorResult>();

function extract(img: HTMLImageElement): ColorResult | null {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 16;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, 16, 16);
  const data = ctx.getImageData(0, 0, 16, 16).data;

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
    // Descarta casi-negros y casi-blancos para obtener tonos con carácter
    if (brightness > 30 && brightness < 225) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
  }
  if (!count) return null;

  r = Math.round(r / count);
  g = Math.round(g / count);
  b = Math.round(b / count);

  // Filtro anti-verdes de la identidad visual: desplaza a pizarra/índigo
  // (y oscurece los tonos muy claros para que el texto blanco siga legible)
  const max = Math.max(r, g, b);
  if (max > 170) {
    const k = 170 / max;
    r = Math.round(r * k);
    g = Math.round(g * k);
    b = Math.round(b * k);
  }
  if (g > r * 1.15 && g > b * 1.15) {
    g = Math.round(g * 0.4);
    b = Math.max(b, Math.round(g * 1.3));
  }

  return {
    primary: `rgb(${r}, ${g}, ${b})`,
    rgb: `${r}, ${g}, ${b}`,
    secondary: `rgb(${Math.min(255, r + 30)}, ${Math.max(0, g - 15)}, ${Math.min(255, b + 45)})`,
  };
}

/** Color dominante de una carátula (muestra de 16x16 sobre una imagen de 64px). */
export function useDominantColor(imageUrl?: string): ColorResult {
  const [result, setResult] = useState<ColorResult>(() => (imageUrl && colorCache.get(imageUrl)) || DEFAULT_RESULT);

  useEffect(() => {
    if (!imageUrl) {
      setResult(DEFAULT_RESULT);
      return;
    }
    const cached = colorCache.get(imageUrl);
    if (cached) {
      setResult(cached);
      return;
    }

    let active = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      try {
        const color = extract(img);
        if (!color) return;
        colorCache.set(imageUrl, color);
        if (active) setResult(color);
      } catch {
        /* imagen sin CORS: se mantiene el color anterior */
      }
    };
    img.src = artwork(imageUrl, 64);
    return () => {
      active = false;
    };
  }, [imageUrl]);

  return result;
}
