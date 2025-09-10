// partner-web/src/components/DisablePWA.tsx
import { useEffect } from "react";

/**
 * Este componente se monta al inicio de la app
 * y elimina cualquier Service Worker previo que pudiera estar en cache.
 * Evita el problema del "parpadeo" por SW viejos interceptando requests.
 */
export default function DisablePWA() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => {
          for (const reg of regs) {
            reg.unregister().catch(() => {
              /* noop */
            });
          }
        })
        .catch(() => {
          /* noop */
        });
    }

    // Limpia caches antiguas
    if (window.caches) {
      caches
        .keys()
        .then((keys) => {
          for (const k of keys) {
            caches.delete(k).catch(() => {
              /* noop */
            });
          }
        })
        .catch(() => {
          /* noop */
        });
    }
  }, []);

  return null;
}
