// partner-web/src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";

type Props = {
  roles?: string[];        // roles permitidos (opcional)
  children: ReactNode;
};

/** Intenta obtener el rol del usuario desde storage o desde un JWT */
function getStoredRole(): string | undefined {
  // 1) Buscar un objeto usuario serializado
  const userKeys = ["axioma:user", "axioma:me", "me", "user", "currentUser"];
  for (const k of userKeys) {
    const raw = localStorage.getItem(k) || sessionStorage.getItem(k);
    if (raw) {
      try {
        const u = JSON.parse(raw);
        return u?.role ?? u?.userRole ?? u?.data?.role;
      } catch {
        // ignorar JSON inválido
      }
    }
  }

  // 2) Buscar un token JWT y leer el payload
  const tokenKeys = ["token", "access_token", "accessToken", "jwt", "idToken"];
  for (const k of tokenKeys) {
    const tok = localStorage.getItem(k) || sessionStorage.getItem(k);
    if (tok && tok.split(".").length === 3) {
      try {
        const [, payload] = tok.split(".");
        // compatibilidad con base64url
        const json = JSON.parse(
          atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
        );
        return (
          json?.role ??
          json?.userRole ??
          json?.["https://axioma/role"] // por si usas un namespace en el claim
        );
      } catch {
        // token no decodificable
      }
    }
  }

  return undefined;
}

export default function ProtectedRoute({ roles, children }: Props) {
  const location = useLocation();
  const role = getStoredRole();

  // Si no hay sesión -> al login (sin parpadeos)
  if (!role) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname || "/app" }}
      />
    );
  }

  // Si hay sesión pero rol no autorizado -> a /unauthorized
  if (roles && !roles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
