/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/**/*.{js,ts,jsx,tsx,html}",
    "./src/overlay/**/*.{js,ts,jsx,tsx,html}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'racelab-bg': '#0f1015',
        'racelab-surface': '#16171f',
        'racelab-card': '#1a1b26',
        'racelab-border': '#262838',
        'racelab-red': '#e11d48',
        'racelab-accent': '#ff003b'
      }
    },
  },
  plugins: [],
}
