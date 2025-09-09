// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

const PWA_MODE = (process.env.PWA_MODE || "off").toLowerCase(); 
// "off" | "kill" | "on"

// Config común de la PWA (solo se usa en modos "on" o "kill")
const pwaBaseConfig = {
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
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  },
  workbox: {
    globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
    // No interceptar APIs si algún día sirves backend bajo el mismo host
    navigateFallbackDenylist: [/^\/api\//],
  },
  // Nunca en dev: evita SW en dev (reduce confusión)
  devOptions: {
    enabled: false,
    suppressWarnings: true,
  },
} as const;

function pwaPlugin() {
  if (PWA_MODE === "on") {
    return VitePWA({
      ...pwaBaseConfig,
      registerType: "autoUpdate",
      // inyecta el registro automáticamente
      injectRegister: "auto",
    });
  }
  if (PWA_MODE === "kill") {
    // Genera un SW que se AUTODESREGISTRA al activarse y limpia caché
    return VitePWA({
      ...pwaBaseConfig,
      selfDestroying: true,
      // igual inyectamos el registro para que el SW "killer" se instale y se borre
      injectRegister: "auto",
      // registerType no importa aquí, el SW muere al activarse
    });
  }
  // "off": no PWA
  return null;
}

export default defineConfig({
  plugins: [
    react(),
    // Condicional: solo empuja el plugin si hay modo "on" o "kill"
    ...(pwaPlugin() ? [pwaPlugin() as any] : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
  },
});
