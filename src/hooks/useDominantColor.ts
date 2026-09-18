import { useState, useEffect } from 'react';

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

const DEFAULT_COLOR: RGBColor = { r: 30, g: 215, b: 96 }; // Spotify green default

export function useDominantColor(imageUrl?: string): {
  primary: string;
  secondary: string;
  ambientGradient: string;
} {
  const [color, setColor] = useState<RGBColor>(DEFAULT_COLOR);

  useEffect(() => {
    if (!imageUrl) {
      setColor(DEFAULT_COLOR);
      return;
    }

    let isMounted = true;
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 40;
        canvas.height = 40;
        ctx.drawImage(img, 0, 0, 40, 40);

        const data = ctx.getImageData(0, 0, 40, 40).data;
        let r = 0, g = 0, b = 0, count = 0;

        for (let i = 0; i < data.length; i += 16) {
          const red = data[i];
          const green = data[i + 1];
          const blue = data[i + 2];
          const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

          // Exclude extreme darks and extreme whites for richer mood colors
          if (brightness > 25 && brightness < 235) {
            r += red;
            g += green;
            b += blue;
            count++;
          }
        }

        if (count > 0 && isMounted) {
          setColor({
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(b / count),
          });
        }
      } catch {
        // In case of CORS canvas taint, gracefully keep current color
      }
    };

    return () => {
      isMounted = false;
    };
  }, [imageUrl]);

  const primary = `rgb(${color.r}, ${color.g}, ${color.b})`;
  // Create complementary secondary color with slight rotation
  const secondary = `rgb(${Math.min(255, color.r + 40)}, ${Math.max(0, color.g - 30)}, ${Math.min(255, color.b + 60)})`;
  const ambientGradient = `radial-gradient(circle at 50% 20%, rgba(${color.r}, ${color.g}, ${color.b}, 0.28) 0%, rgba(${color.r}, ${color.g}, ${color.b}, 0.08) 45%, rgba(0, 0, 0, 0) 80%)`;

  return { primary, secondary, ambientGradient };
}
