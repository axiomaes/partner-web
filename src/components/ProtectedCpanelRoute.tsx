import { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { useSession, isSuperAdmin } from "@/shared/auth";

function Splash() {
  return (
    <div className="min-h-dvh grid place-items-center bg-base-200">
      <div className="text-center space-y-3">
        <span className="loading loading-spinner loading-lg" />
        <p className="opacity-70">Cargando…</p>
      </div>
    </div>
  );
}

export default function ProtectedCpanelRoute({ children }: PropsWithChildren) {
  const s = useSession();

  if (!s.ready) return <Splash />;                 // esperar hidratación
  if (!s.token) return <Navigate to="/login" replace />; // sin sesión → login
  if (!isSuperAdmin(s)) return <Navigate to="/unauthorized" replace />;

  return <>{children}</>;
}
