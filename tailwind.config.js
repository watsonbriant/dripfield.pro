/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['SF Pro', 'Inter', 'system-ui', 'sans-serif'],
        hero: ['Hero', 'SF Pro', 'Inter', 'system-ui', 'sans-serif'],
        mohr: ['Mohr', 'SF Pro', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontFeatureSettings: {
        numeric: '"tnum" 1',
      },
      colors: {
        primary: '#fae2c6',
        secondary: '#7fc3b6',
        tertiary: '#8e6c7a',
        canvas: '#f7d8b4',
        'surface-primary': '#FFFFFF',
        'surface-secondary': '#FFFFFF',
        'border-primary': '#000000',
        'border-secondary': '#4e4e4e',
      },
    },
  },
  plugins: [],
};