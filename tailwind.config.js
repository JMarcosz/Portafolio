/** @type {import('tailwindcss').Config} */
module.exports = {

  purge: [

    './*.html',

    './src/**/*.js',

  ],
   darkMode: true, // or 'media' or 'class'
   theme: {
    colors: {
      'primary': '#4B7CF9',
      'secondary': '#373A3D',
      's-white': '#F3F4F6',
      'b-black': '#181717',
      'g-gray': '#292C2F',
    },
   },
   variants: {},
   plugins: [],
 }