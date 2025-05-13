/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', 'system-ui', 'sans-serif'],
        hero: ['Hero', 'Inter var', 'system-ui', 'sans-serif'],
        mohr: ['Mohr', 'Inter var', 'system-ui', 'sans-serif'],
      },
      fontFeatureSettings: {
        numeric: '"tnum" 1',
      },
      colors: {
        primary: '#fae2c6',
        secondary: '#7fc3b6',
        tertiary: '#8e6c7a',
        canvas: '#101c26',
        'surface-primary': '#FFFFFF',
        'surface-secondary': '#FFFFFF',
        'border-primary': '#E5E7EB',
        'border-secondary': '#fce7ca',
      },
    },
  },
  plugins: [],
};