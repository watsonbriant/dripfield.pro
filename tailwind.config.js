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
        primary: '#e0dcc3', // live album
        secondary: '#585b52', // grey
        tertiary: '#f49b1d', // orange
        fourth: '#3c1e40', // purple
        fifth: '#181818', // black
        canvas: '#fee5bc', // tan
        'surface-primary': '#FFFFFF',
        'surface-secondary': '#FFFFFF',
        'border-primary': '#000000',
        'border-fourth': '#4e4e4e',
      },
    },
  },
  plugins: [],
};