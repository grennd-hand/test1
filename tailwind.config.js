/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
        'sans': ['Noto Sans SC', 'sans-serif'],
      },
      colors: {
        'cyber-dark': '#0a0a16',
        'cyber-blue': '#00f0ff',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'glitch': 'glitch 1s linear infinite',
        'scan-line': 'scan-line 2s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { textShadow: '0 0 4px #00ffff, 0 0 11px #00ffff, 0 0 19px #00ffff' },
          '100%': { textShadow: '0 0 4px #00ffff, 0 0 15px #00ffff, 0 0 25px #00ffff' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' }
        },
        'scan-line': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' }
        }
      },
      backgroundImage: {
        'grid-cyan-900': 'linear-gradient(to right, #164e63 1px, transparent 1px), linear-gradient(to bottom, #164e63 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '20px 20px',
      }
    },
  },
  plugins: [],
} 