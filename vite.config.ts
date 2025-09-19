// partner-web/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

let VitePWA: any;
try {
  VitePWA = require("vite-plugin-pwa").VitePWA;
} catch {
  VitePWA = null;
}

const isPwaOn = process.env.PWA_MODE === "on";

// Ajusta esto si cambias el dominio/base de la API:
const API_HOST_RX = /^https?:\/\/axioma-api\.stacks\.axioma-creativa\.es\/?/i;

export default defineConfig({
  plugins: [
    react(),
    ...(isPwaOn && VitePWA
      ? [
          VitePWA({
            registerType: "autoUpdate",
            injectRegister: "auto",
            // en dev: no registrar SW
            devOptions: { enabled: false },

            includeAssets: ["favicon.svg", "robots.txt"],
            manifest: {
              name: "Axioma Loyalty",
              short_name: "Axioma",
              start_url: "/",
              display: "standalone",
              background_color: "#ffffff",
              theme_color: "#111827",
              icons: [
                { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
                { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
              ]
            },

            workbox: {
              // no intentes servir fallback para rutas de API/cpanel/public
              navigateFallbackDenylist: [
                /\/api\//i,
                /^\/cp(anel)?\//i,
                /\/public\//i
              ],
              globPatterns: ["**/*.{js,css,html,ico,png,svg}"],

              runtimeCaching: [
                // 1) API → nunca cachear
                {
                  urlPattern: (ctx: any) => {
                    const u = ctx?.url?.href || "";
                    return API_HOST_RX.test(u) || /\/api\//i.test(u);
                  },
                  handler: "NetworkOnly",
                  method: "GET",
                  options: { cacheName: "api-no-cache" }
                },

                // 2) QR públicos → nunca cachear (para evitar PNG obsoletos)
                {
                  urlPattern: /\/public\/customers\/.+\/qr\.png$/i,
                  handler: "NetworkOnly",
                  method: "GET",
                  options: { cacheName: "qr-no-cache" }
                },

                // 3) Navegación/HTML → NetworkFirst (así pillas la versión nueva si hay red)
                {
                  urlPattern: ({ request }: any) => request.mode === "navigate",
                  handler: "NetworkFirst",
                  options: {
                    cacheName: "pages",
                    networkTimeoutSeconds: 3,
                    expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 } // 1 día
                  }
                },

                // 4) JS/CSS/Workers → SWR
                {
                  urlPattern: ({ request }: any) =>
                    ["script", "style", "worker"].includes(request.destination),
                  handler: "StaleWhileRevalidate",
                  options: {
                    cacheName: "assets",
                    expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 } // 7 días
                  }
                },

                // 5) Imágenes (NO QR) → SWR
                {
                  urlPattern: ({ request, url }: any) => {
                    if (request.destination !== "image") return false;
                    // excluye explícitamente los QR por si llegan aquí
                    if (/\/public\/customers\/.+\/qr\.png$/i.test(url.href)) return false;
                    return true;
                  },
                  handler: "StaleWhileRevalidate",
                  options: {
                    cacheName: "img",
                    expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 } // 7 días
                  }
                }
              ]
            }
          })
        ]
      : [])
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  build: {
    sourcemap: false
  }
});
