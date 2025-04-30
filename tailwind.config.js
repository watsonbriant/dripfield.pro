/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', 'system-ui', 'sans-serif'],
      },
      fontFeatureSettings: {
        numeric: '"tnum" 1',
      },
      colors: {
        primary: '#101c26',
        secondary: '#f38ba0',
        tertiary: '#ec741d',
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
