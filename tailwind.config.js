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
        // Superficies "laca" con subtono burdeos (sistema v3)
        ink: '#110B0C', // fondo
        lacquer: '#1B1213', // superficies
        raised: '#251819', // superficies elevadas / hover
        line: 'rgba(244, 236, 231, 0.08)', // separadores finos
        paper: '#F4ECE7', // texto principal (blanco cálido)
        mute: '#A8958F', // texto secundario
        faint: '#6E5C57', // texto terciario
        brass: '#C9A56B', // solo etiquetas y eje de los vinilos
        brand: {
          red: '#C81900', // rojo del logo: acción principal
          darkred: '#A51500',
          lightred: '#E02200',
          crimson: '#A51500',
          ruby: '#8E0F00',
          wine: '#540900',
          burgundy: '#360500',
          garnet: '#220300',
          coral: '#FF5A3C', // estados activos (menos neón que antes)
          rose: '#FF8A70',
          blush: '#FFB9A8',
          scarlet: '#D61B00',
          // Guardarraíles: ningún verde puede aparecer en la UI
          green: '#C81900',
          darkgreen: '#A51500',
          accent: '#C81900',
          surface: '#1B1213',
          surfaceHighlight: '#251819',
          surfaceElevated: '#2E1F20',
          card: 'rgba(244, 236, 231, 0.04)',
          cardHover: 'rgba(244, 236, 231, 0.08)',
        },
      },
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'Geist', 'sans-serif'],
      },
      fontSize: {
        // Escala tipográfica (cuarta justa ~1.333)
        'display-xl': ['clamp(2.75rem, 6vw, 5.25rem)', { lineHeight: '0.95', letterSpacing: '-0.035em' }],
        'display-lg': ['clamp(2.1rem, 4.2vw, 3.5rem)', { lineHeight: '1', letterSpacing: '-0.03em' }],
        'display-md': ['clamp(1.5rem, 2.6vw, 2rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
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
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        'fade-in': 'fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up': 'slideUp 0.42s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-up': 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        rise: 'rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        view: 'view 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        eq: 'eqBar 0.9s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        scaleUp: {
          from: { opacity: '0', transform: 'scale(0.96) translateY(10px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        view: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        eqBar: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
    },
  },
  plugins: [],
};
