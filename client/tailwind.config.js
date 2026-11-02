/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF7',
          100: '#FAF7F2',
          200: '#F4EFE6',
          300: '#EAE1D2',
        },
        burgundy: {
          50: '#FDF2F4',
          100: '#FCE7EB',
          200: '#F8C8D2',
          300: '#F195A8',
          400: '#E45B7B',
          500: '#CA2954',
          600: '#A91B3E',
          700: '#800020', // Primary Burgundy
          800: '#5F0018',
          900: '#420011',
          950: '#28000A',
        },
        emerald: {
          tint: '#E8F5E9',
          accent: '#1B4D3E',
          sage: '#2D6A4F',
          light: '#52B788',
        },
        pink: {
          tint: '#FFF0F3',
          border: '#FBC4D0',
        }
      },
      fontFamily: {
        sans: ['"Outfit"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Fredoka"', '"Outfit"', 'cursive', 'sans-serif']
      },
      animation: {
        'pop-in': 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'bounce-gentle': 'bounceGentle 2s infinite ease-in-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        'stamp-x': 'stampX 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        popIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(128, 0, 32, 0.4)' },
          '50%': { boxShadow: '0 0 25px rgba(128, 0, 32, 0.8)' }
        },
        stampX: {
          '0%': { transform: 'scale(2.5) rotate(-15deg)', opacity: '0' },
          '50%': { transform: 'scale(0.9) rotate(5deg)', opacity: '0.9' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' }
        }
      }
    },
  },
  plugins: [],
}

