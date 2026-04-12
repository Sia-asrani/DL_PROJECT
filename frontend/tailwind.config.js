/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: '#0d1117',
        surface: '#161b22',
        surfaceHover: '#21262d',
        primary: '#58a6ff',
        primaryLight: '#79b8ff',
        success: '#2ea043',
        danger: '#f85149',
        border: '#30363d',
        textMain: '#c9d1d9',
        textMuted: '#8b949e',
      }
    },
  },
  plugins: [],
}
