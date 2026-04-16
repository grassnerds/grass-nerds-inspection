/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'gn-navy': '#162f6e',
        'gn-lime': '#c1d62f',
        'gn-navy-light': '#1a3a8a',
      },
      fontFamily: {
        heading: ['Nunito', 'sans-serif'],
        body: ['Nunito', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
