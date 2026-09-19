import { useState, useEffect } from 'react';

interface ColorResult {
  primary: string;
  secondary: string;
  ambientGradient: string;
}

const DEFAULT_RESULT: ColorResult = {
  primary: 'rgb(22, 28, 45)', // Deep luxury midnight indigo
  secondary: 'rgb(14, 18, 30)', // Dark slate obsidian
  ambientGradient: 'radial-gradient(circle at 50% 20%, rgba(26, 34, 56, 0.45) 0%, rgba(9, 11, 16, 0) 80%)',
};

// Global cache to avoid recomputing colors for same album art
const colorCache = new Map<string, ColorResult>();

export function useDominantColor(imageUrl?: string): ColorResult {
  const [result, setResult] = useState<ColorResult>(() => {
    if (imageUrl && colorCache.has(imageUrl)) {
      return colorCache.get(imageUrl)!;
    }
    return DEFAULT_RESULT;
  });

  useEffect(() => {
    if (!imageUrl) {
      setResult(DEFAULT_RESULT);
      return;
    }

    if (colorCache.has(imageUrl)) {
      setResult(colorCache.get(imageUrl)!);
      return;
    }

    let isMounted = true;
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // Sample with a tiny 16x16 canvas for blazing speed and zero CPU lag
        canvas.width = 16;
        canvas.height = 16;
        ctx.drawImage(img, 0, 0, 16, 16);

        const data = ctx.getImageData(0, 0, 16, 16).data;
        let r = 0, g = 0, b = 0, count = 0;

        for (let i = 0; i < data.length; i += 4) {
          const red = data[i];
          const green = data[i + 1];
          const blue = data[i + 2];
          const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

          // Filter out near-blacks and near-whites for vivid mood colors
          if (brightness > 30 && brightness < 225) {
            r += red;
            g += green;
            b += blue;
            count++;
          }
        }

        if (count > 0 && isMounted) {
          let avgR = Math.round(r / count);
          let avgG = Math.round(g / count);
          let avgB = Math.round(b / count);

          // Ensure no green ambient hue is ever cast; shift towards deep slate/indigo if green dominates
          if (avgG > avgR * 1.15 && avgG > avgB * 1.15) {
            avgG = Math.round(avgG * 0.4);
            avgB = Math.max(avgB, Math.round(avgG * 1.3));
          }

          const primary = `rgb(${avgR}, ${avgG}, ${avgB})`;
          const secondary = `rgb(${Math.min(255, avgR + 30)}, ${Math.max(0, avgG - 15)}, ${Math.min(255, avgB + 45)})`;
          const ambientGradient = `radial-gradient(circle at 50% 20%, rgba(${avgR}, ${avgG}, ${avgB}, 0.28) 0%, rgba(0, 0, 0, 0) 80%)`;

          const calculated = { primary, secondary, ambientGradient };
          colorCache.set(imageUrl, calculated);
          setResult(calculated);
        }
      } catch {
        // Graceful fallback
      }
    };

    return () => {
      isMounted = false;
    };
  }, [imageUrl]);

  return result;
}
