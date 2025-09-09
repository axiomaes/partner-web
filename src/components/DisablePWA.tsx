// src/components/DisablePWA.tsx
import { useEffect } from "react";

export default function DisablePWA(): null {
  useEffect(() => {
    // 1) Desregistrar cualquier Service Worker activo
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => {
          regs.forEach((r) => {
            r.unregister().catch(() => {});
          });
        })
        .catch(() => {});
    }

    // 2) Limpiar caches PWA
    if (typeof window !== "undefined" && "caches" in window) {
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .catch(() => {});
    }
  }, []);

  return null;
}
