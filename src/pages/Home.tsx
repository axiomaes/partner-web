// partner-web/src/pages/Home.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/shared/auth";

export default function Home() {
  const nav = useNavigate();
  const s = useSession();

  useEffect(() => {
    if (!s.ready) return; // espera a que la sesión esté lista

    // Sin sesión → a login
    if (!s.token) {
      nav("/login", { replace: true });
      return;
    }

    // Con sesión: decide por rol
    if (s.role === "SUPERADMIN") {
      nav("/cpanel", { replace: true });
    } else {
      nav("/app", { replace: true });
    }
  }, [s.ready, s.token, s.role, nav]);

  // Loader mientras decide
  return (
    <div className="min-h-screen grid place-items-center bg-base-200">
      <div className="text-center space-y-3">
        <span className="loading loading-spinner loading-lg" />
        <p className="opacity-70">Cargando…</p>
      </div>
    </div>
  );
}
