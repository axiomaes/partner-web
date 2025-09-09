// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import { VitePWA } from "vite-plugin-pwa";  // ❌ desactivado
import path from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // ❌ Bloque desactivado temporalmente para evitar SW/titilado
    /*
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Axioma Partner",
        short_name: "Partner",
        description: "Agenda, fidelización y mensajería",
        theme_color: "#0e7490",
        background_color: "#f3f4f6",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        // evita que el SW intercepte llamadas a tu API si sirves bajo el mismo dominio
        navigateFallbackDenylist: [/^\/api\//]
      },
      devOptions: {
        enabled: true,
        suppressWarnings: true
      }
    })
    */
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  server: {
    port: 5173
  }
});
