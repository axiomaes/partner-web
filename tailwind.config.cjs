// tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        lacubierta: {
          // base
          'primary': '#0D7377',
          'primary-content': '#ffffff',
          'secondary': '#1B9AAA',
          'accent': '#E84545',
          'neutral': '#2A2E35',
          'base-100': '#ffffff',
          'base-200': '#f4f6f8',
          'base-300': '#e6e9ef',
          'info': '#1C92F2',
          'success': '#22C55E',
          'warning': '#F59E0B',
          'error': '#EF4444',
        },
      },
      'light',
    ],
  },
};
