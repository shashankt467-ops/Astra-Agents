/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enables dark-mode toggling using the 'dark' class
  theme: {
    extend: {
      colors: {
        obsidian: {
          900: '#09090b',
          800: '#121214',
          700: '#1a1a1e',
          600: '#27272a'
        },
        cyber: {
          cyan: '#06b6d4',
          teal: '#14b8a6',
          neon: '#a855f7',
          pink: '#ec4899',
          blue: '#3b82f6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
