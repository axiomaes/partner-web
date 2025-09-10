// src/components/ProtectedRoute.tsx
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useSession, hasRole, type UserRole } from "@/shared/auth";

/** Props para proteger una ruta concreta (componente hijo) */
type ProtectedRouteProps = {
  /** Roles permitidos para acceder a la ruta */
  roles: UserRole[];
  /** Ruta de fallback cuando hay sesión pero no permisos (por defecto /unauthorized) */
  to?: string;
  /** Contenido protegido */
  children: JSX.Element;
};

/**
 * Guard para rutas “hoja”: protege un componente concreto.
 * - Espera a que la sesión esté lista (`s.ready`) para evitar parpadeos.
 * - Si no hay sesión -> /login (con `from` incluyendo query + hash).
 * - Si hay sesión pero sin permisos -> `to` (por defecto /unauthorized).
 */
export default function ProtectedRoute({
  roles,
  to = "/unauthorized",
  children,
}: ProtectedRouteProps) {
  const s = useSession();
  const loc = useLocation();

  // 1) Espera hidratación de sesión (evita saltos visuales y redirecciones en falso)
  if (!s.ready) return null;

  // 2) Sin sesión -> login (conserva la ruta original + query + hash para volver luego)
  if (!s.token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: loc.pathname + loc.search + loc.hash }}
      />
    );
  }

  // 3) Con sesión pero sin rol permitido -> fallback
  if (!hasRole(s, roles)) {
    return <Navigate to={to} replace />;
  }

  // 4) Acceso concedido
  return children;
}

/** Props para proteger un layout con rutas anidadas (usa <Outlet/>) */
type ProtectedLayoutProps = {
  roles: UserRole[];
  to?: string;
};

/**
 * Variante para rutas con hijos anidados:
 * <Route element={<ProtectedLayout roles={...}/>}>
 *   <Route path="..." element={<Page/>}/>
 * </Route>
 */
export function ProtectedLayout({ roles, to = "/unauthorized" }: ProtectedLayoutProps) {
  const s = useSession();
  const loc = useLocation();

  if (!s.ready) return null;

  if (!s.token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: loc.pathname + loc.search + loc.hash }}
      />
    );
  }

  if (!hasRole(s, roles)) {
    return <Navigate to={to} replace />;
  }

  return <Outlet />;
}
