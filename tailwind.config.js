/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#1ed760',
          darkgreen: '#1db954',
          accent: '#fa2d48', // Apple Music vibe accent
          purple: '#7928ca',
          cyan: '#00f2fe',
          surface: '#121212',
          surfaceHighlight: '#1f1f1f',
          surfaceElevated: '#282828',
          card: 'rgba(255, 255, 255, 0.05)',
          cardHover: 'rgba(255, 255, 255, 0.1)',
        }
      },
      fontFamily: {
        sans: ['Circular', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-mesh': 'gradientMesh 15s ease infinite alternate',
      },
      keyframes: {
        gradientMesh: {
          '0%': { transform: 'scale(1) rotate(0deg)' },
          '50%': { transform: 'scale(1.1) rotate(5deg)' },
          '100%': { transform: 'scale(0.95) rotate(-5deg)' },
        }
      }
    },
  },
  plugins: [],
}
