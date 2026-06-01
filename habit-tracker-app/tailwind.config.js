/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#6C63FF',
        secondary: '#FF6584',
        accent: '#43C59E',
        dark: '#1E1E2E',
        surface: '#2A2A3E',
        muted: '#A0A0B0',
      },
    },
  },
  plugins: [],
};
