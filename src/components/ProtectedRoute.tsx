import { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { useSession, type UserRole, hasRole } from "@/shared/auth";

type Props = PropsWithChildren<{
  roles?: UserRole[]; // si se omite, basta con estar autenticado
}>;

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

export default function ProtectedRoute({ roles, children }: Props) {
  const s = useSession();

  if (!s.ready) return <Splash />;          // esperar hidratación
  if (!s.token) return <Navigate to="/login" replace />; // sin sesión → login

  // Si hay lista de roles, verificar
  if (roles && roles.length > 0 && !hasRole(s, roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
