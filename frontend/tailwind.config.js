/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        anime: {
          primary: '#6366f1',
          secondary: '#ec4899',
          dark: '#1e1b4b',
          light: '#f5f3ff'
        }
      }
    }
  },
  plugins: []
};
