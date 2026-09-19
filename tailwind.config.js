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
          red: '#c81900',
          darkred: '#a51500',
          lightred: '#e02200',
          crimson: '#a51500',
          green: '#c81900',       // Maps existing brand-green to logo scarlet
          darkgreen: '#a51500',   // Maps existing darkgreen to logo crimson
          accent: '#c81900',
          purple: '#7928ca',
          cyan: '#00f2fe',
          surface: '#1a1a1a',     // Exact logo background
          surfaceHighlight: '#242424',
          surfaceElevated: '#2d2d2d',
          card: 'rgba(255, 255, 255, 0.04)',
          cardHover: 'rgba(255, 255, 255, 0.08)',
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
