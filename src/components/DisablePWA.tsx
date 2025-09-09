// src/components/DisablePWA.tsx
import { useEffect } from "react";

export default function DisablePWA() {
  useEffect(() => {
    // 1) Unregister all service workers
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
    }
    // 2) Clear caches created by the PWA
    if ("caches" in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
    // 3) Evitar loops de "claim → reload"
    if (navigator.serviceWorker?.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({ type: "SKIP_RELOAD" });
      } catch {}
    }
    // 4) Solo log diagnóstico
    // console.warn("[PWA] ServiceWorker disabled & caches cleared");
  }, []);
  return null;
}
