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
          red: '#c81900',          // Logo scarlet red
          darkred: '#a51500',      // Logo deep crimson underline
          lightred: '#e02200',     // Vibrant fiery red hover
          crimson: '#a51500',      // Logo deep crimson
          ruby: '#8e0f00',         // Rich saturated ruby jewel
          wine: '#540900',         // Velvet wine dark accent
          burgundy: '#360500',     // Ultra-deep luxury burgundy for backdrops
          garnet: '#220300',       // Dark ambient glow tone
          coral: '#ff3b24',        // High-contrast coral red for active pips & badges
          rose: '#ff6b57',         // Warm rose accent for subtitles & chips
          blush: '#ffa89c',        // Soft blush highlight
          scarlet: '#d61b00',      // Balanced scarlet
          // Color guardrails (prevents any green from ever appearing)
          green: '#c81900',
          darkgreen: '#a51500',
          accent: '#c81900',
          purple: '#7928ca',
          cyan: '#00f2fe',
          surface: '#1a1a1a',      // Exact logo matte dark charcoal
          surfaceHighlight: '#231d1d', // Subtle warm tone
          surfaceElevated: '#2a2222',  // Elevated panels
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
