/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          DEFAULT: '#FF9933',
        },
        gold: {
          100: '#FFFDE7',
          200: '#FFF9C4',
          300: '#FFE57F',
          400: '#FFD700',
          500: '#FFC107',
          600: '#FFA000',
          700: '#FF8F00',
          DEFAULT: '#FFD700',
        },
        maroon: {
          700: '#800000',
          800: '#5a0000',
          900: '#3d0000',
          950: '#250000',
          DEFAULT: '#800000',
        },
        cream: '#FFF8E7',
      },
      fontFamily: {
        gujarati: ['Noto Serif Gujarati', 'serif'],
        cinzel: ['Cinzel', 'serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 30s linear infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.04)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [],
}
