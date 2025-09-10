// src/components/ProtectedCpanelRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useSession, isSuperAdmin } from "@/shared/auth";

/**
 * Ruta protegida SOLO para SUPERADMIN y (opcional) allowlist por email.
 *
 * Evita bucles de navegación:
 * - Si no hay sesión -> /login (con `from` para volver luego)
 * - Si hay sesión pero no cumple -> /unauthorized (NUNCA a "/")
 */
type Props = {
  children: JSX.Element;
};

// Permite configurar por env: VITE_CPANEL_SUPERS="admin@axioma-creativa.es,otro@mail.com"
const RAW_ALLOW = (import.meta as any)?.env?.VITE_CPANEL_SUPERS as string | undefined;
const ALLOWED: string[] = String(RAW_ALLOW ?? "admin@axioma-creativa.es")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export default function ProtectedCpanelRoute({ children }: Props) {
  const s = useSession();
  const loc = useLocation();

  // Espera hidratación para no redirigir en falso
  if (!s.ready) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <span className="loading loading-spinner" />
      </div>
    );
  }

  // Sin sesión -> login
  if (!s.token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${loc.pathname}${loc.search || ""}` }}
      />
    );
  }

  // Debe ser SUPERADMIN
  if (!isSuperAdmin(s)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // (Opcional) allowlist por email
  const emailOk = !!s.email && ALLOWED.includes(String(s.email).toLowerCase());
  if (!emailOk) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
