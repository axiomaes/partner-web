// partner-web/src/pages/Home.tsx
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/shared/auth";

export default function Home() {
  const nav = useNavigate();
  const s = useSession();

  // 👇 Cortafuegos para evitar doble navegación
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return; // ya navegamos antes
    if (!s.ready) return;

    if (!s.token) {
      redirected.current = true;
      nav("/login", { replace: true });
      return;
    }

    if (s.role === "SUPERADMIN") {
      redirected.current = true;
      nav("/cpanel", { replace: true });
    } else {
      redirected.current = true;
      nav("/app", { replace: true });
    }
  }, [s.ready, s.token, s.role, nav]);

  return (
    <div className="min-h-screen grid place-items-center bg-base-200">
      <div className="text-center space-y-3">
        <span className="loading loading-spinner loading-lg" />
        <p className="opacity-70">Axioma Loyalty</p>
      </div>
    </div>
  );
}
