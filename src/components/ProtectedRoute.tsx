// src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useSession, hasRole, type UserRole } from "@/shared/auth";

type Props = {
  /** Roles permitidos para acceder a la ruta */
  roles: UserRole[];
  /** Ruta a la que redirigir si tiene sesión pero no permiso */
  to?: string;
  /** Contenido protegido */
  children: JSX.Element;
};

export default function ProtectedRoute({ roles, to = "/unauthorized", children }: Props) {
  const s = useSession();
  const loc = useLocation();

  // Espera a que la sesión esté hidratada para evitar parpadeos/redirecciones falsas
  if (!s.ready) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <span className="loading loading-spinner" />
      </div>
    );
  }

  // Sin sesión -> login (guard universal)
  if (!s.token) {
    return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  }

  // Con sesión pero sin rol permitido -> to (por defecto /unauthorized)
  if (!hasRole(s, roles)) {
    return <Navigate to={to} replace />;
  }

  // Acceso concedido
  return children;
}
