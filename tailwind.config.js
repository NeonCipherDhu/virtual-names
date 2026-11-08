/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Segoe UI Variable Text"', '"Segoe UI"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Cascadia Code"', '"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      colors: {
        stealth: {
          950: '#090b10',
          900: '#0f1219',
          850: '#141821',
          800: '#1a202c',
          700: '#252d3d',
          600: '#343f54',
        }
      }
    },
  },
  plugins: [],
}
