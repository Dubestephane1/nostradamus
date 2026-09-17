/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./_includes/**/*.njk",
    "./bibliography11.html",
    "./js/app.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        playfair: ['Playfair Display', 'serif'],
      }
    }
  },
  plugins: [],
}
