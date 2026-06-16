/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a3c7a',
          dark: '#0d1f4a',
          light: '#eef2fb',
        },
        gold: {
          DEFAULT: '#d4a843',
          dark: '#b8912e',
          light: '#fdf4dc',
        },
        border: '#c5d0e8',
        muted: '#4a5c82',
      },
    },
  },
  plugins: [],
};
