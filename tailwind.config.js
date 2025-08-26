/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Rubik', 'Inter', 'system-ui', 'sans-serif'],
        hero: ['Hero', 'SF Pro', 'Inter', 'system-ui', 'sans-serif'],
        mohr: ['Mohr', 'SF Pro', 'Inter', 'system-ui', 'sans-serif'],
        trad: ['Traditional', 'Times', 'system-ui', 'sans-serif'],
        tradi: ['TraditionalI', 'TimesI', 'system-ui', 'sans-serif']
      },
      fontFeatureSettings: {
        numeric: '"tnum" 1',
      },
      colors: {
        primary: '#fdfdfd', // white
        secondary: '#b4b2b2', // gray
        tertiary: '#8ec1b6', // teal
        fourth: '#8e6c7a', // purple
        fifth: '#272727', // black
        canvas: '#e7e7e7', // light gray
        'surface-primary': '#FFFFFF',
        'surface-secondary': '#FFFFFF',
        'border-primary': '#000000',
        'border-secondary': '#4e4e4e',
      },
    },
  },
  plugins: [],
};