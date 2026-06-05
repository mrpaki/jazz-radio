/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        jazz: {
          dark:   '#08080e',
          card:   '#111120',
          border: '#252538',
          gold:   '#c9a84c',
          'gold-light': '#dfc46a',
          cream:  '#f0e8d0',
          muted:  '#6b6b8a',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', 'serif'],
      },
      animation: {
        'spin-slow': 'spin 4s linear infinite',
        'pulse-gold': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
