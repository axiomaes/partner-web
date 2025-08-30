// partner-web/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0e7490',
          primaryDark: '#155e75',
          cream: '#f8fafc',
          gold: '#f59e0b',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
