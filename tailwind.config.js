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
        // Tema de marca La Cubierta / Axioma
        axioma: {
          /* Colores principales */
          primary: '#0EA5E9',
          'primary-content': '#ffffff',

          secondary: '#64748B',
          'secondary-content': '#ffffff',

          accent: '#22C55E',
          'accent-content': '#052e13',

          neutral: '#1F2937',
          'neutral-content': '#ffffff',

          /* Base (fondos y texto) */
          'base-100': '#ffffff',
          'base-200': '#f3f4f6',
          'base-300': '#e5e7eb',
          'base-content': '#111827',

          /* Estados */
          info: '#38BDF8',
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',

          /* Ajustes de estilo DaisyUI */
          '--rounded-box': '1rem',     // cards / modals
          '--rounded-btn': '.75rem',   // botones
          '--rounded-badge': '1.25rem',
          '--btn-text-case': 'none',   // NO mayúsculas forzadas
          '--tab-border': '1px',
          '--tab-radius': '.5rem',
        },
      },
      'light',
      'dark',
    ],
    darkTheme: 'dark',
  },
};
