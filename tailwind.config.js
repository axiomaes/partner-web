// partner-web/tailwind.config.js
import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        axioma: {
          primary: '#0EA5E9',
          'primary-content': '#ffffff',
          secondary: '#64748B',
          accent: '#22C55E',
          neutral: '#1F2937',
          'base-100': '#ffffff',
          'base-200': '#f3f4f6',
          'base-300': '#e5e7eb',
          info: '#38BDF8',
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
        },
      },
      'light',
      'dark',
    ],
    darkTheme: 'dark',
  },
};
