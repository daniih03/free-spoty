/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        xs: '400px',
      },
      colors: {
        brand: {
          red: '#c81900', // Rojo escarlata primario (logo)
          darkred: '#a51500',
          lightred: '#e02200', // Hover vibrante
          crimson: '#a51500', // Carmesí profundo
          ruby: '#8e0f00',
          wine: '#540900', // Velvet wine
          burgundy: '#360500',
          garnet: '#220300',
          coral: '#ff3b24', // Estados activos
          rose: '#ff6b57', // Subtítulos y chips
          blush: '#ffa89c',
          scarlet: '#d61b00',
          // Guardarraíles: ningún verde puede aparecer en la UI
          green: '#c81900',
          darkgreen: '#a51500',
          accent: '#c81900',
          surface: '#1a1a1a', // Carbón mate del logo
          surfaceHighlight: '#231d1d',
          surfaceElevated: '#2a2222',
          card: 'rgba(255, 255, 255, 0.04)',
          cardHover: 'rgba(255, 255, 255, 0.08)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      spacing: {
        18: '4.5rem',
      },
      scale: {
        108: '1.08',
      },
      borderWidth: {
        3: '3px',
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up': 'slideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-up': 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        eq: 'eqBar 0.9s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'scale(0.98)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        scaleUp: {
          from: { opacity: '0', transform: 'scale(0.95) translateY(8px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        eqBar: {
          '0%, 100%': { transform: 'scaleY(0.35)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
    },
  },
  plugins: [],
};
