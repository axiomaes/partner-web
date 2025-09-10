// partner-web/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// ⬇️ importa solo si existe el paquete; no fallará si no lo tenemos instalado
let VitePWA: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  VitePWA = require('vite-plugin-pwa').VitePWA;
} catch {
  VitePWA = null;
}

const isPwaOn = process.env.PWA_MODE === 'on';

export default defineConfig({
  plugins: [
    react(),
    ...(isPwaOn && VitePWA
      ? [
          VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            includeAssets: ['favicon.svg', 'robots.txt'],
            manifest: {
              name: 'Axioma Loyalty',
              short_name: 'Axioma',
              start_url: '/',
              display: 'standalone',
              background_color: '#ffffff',
              theme_color: '#111827',
              icons: [
                { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
              ]
            }
          })
        ]
      : [])
  ],
  build: {
    sourcemap: false
  }
});
