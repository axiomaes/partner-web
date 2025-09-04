// src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/shared/auth";

type Props = {
  roles?: Array<"ADMIN" | "BARBER" | "OWNER" | "SUPERADMIN">;
  children: React.ReactNode;
};

export default function ProtectedRoute({ roles, children }: Props) {
  const { token, role, ready } = useSession();
  const loc = useLocation();

  // Bloqueo inicial para evitar falsas redirecciones
  if (!ready) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <span className="loading loading-spinner" />
      </div>
    );
  }

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: loc.pathname + loc.search }}
      />
    );
  }

  if (roles && role && !roles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
