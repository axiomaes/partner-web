// partner-web/src/components/DisablePWA.tsx
import { useEffect } from "react";

export default function DisablePWA() {
  useEffect(() => {
    (async () => {
      try {
        let hadSW = false;

        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          if (regs.length) hadSW = true;
          await Promise.all(regs.map(r => r.unregister().catch(() => null)));
          // Si hay controlador, pedirle terminar
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
          }
        }
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k).catch(() => null)));
        }
        // Recarga dura una vez si había SW
        if (hadSW && !sessionStorage.getItem("__pwa_cleared__")) {
          sessionStorage.setItem("__pwa_cleared__", "1");
          window.location.replace(window.location.pathname + window.location.search);
        }
      } catch {}
    })();
  }, []);
  return null;
}
