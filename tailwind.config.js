/** @type {import('tailwindcss').Config} */
module.exports = {
  purge: ["./*.html", "./src/**/*.js"],
  darkMode: "class", // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primary: "#4B7CF9",
        secondary: "#373A3D",
        "s-white": "#F3F4F6",
        "b-black": "#181717",
        "g-gray": "#292C2F",
        "yellow": "#facc15",
      },

      animation: {
        'loop-scroll': 'loop-scroll 25s linear infinite',
      },
      keyframes: {
        'loop-scroll': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-100%)' },
        }
      }
    },
  },
  variants: {},
  plugins: [],
};
