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
        cyber: {
          bg: '#030712',      // Deep slate/gray-950
          card: '#0B0F19',    // Sleek dark card
          border: '#1E293B',  // Slate-800
          green: '#10B981',   // Emerald emerald-500
          red: '#EF4444',     // Rose rose-500
          blue: '#3B82F6',    // Electric blue
          neon: '#06B6D4',    // Cyan cyan-500
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
