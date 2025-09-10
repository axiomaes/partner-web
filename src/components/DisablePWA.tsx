// partner-web/src/components/DisablePWA.tsx
import { useEffect } from 'react';

export default function DisablePWA() {
  useEffect(() => {
    (async () => {
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r => r.unregister().catch(() => null)));
          // Forzar control de página fuera del SW
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
          }
        }
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k).catch(() => null)));
        }
        // Fuerza recarga dura una sola vez si había SW
        const flag = sessionStorage.getItem('__pwa_cleared__');
        if (!flag) {
          sessionStorage.setItem('__pwa_cleared__', '1');
          window.location.replace(window.location.pathname + window.location.search);
        }
      } catch {}
    })();
  }, []);
  return null;
}
