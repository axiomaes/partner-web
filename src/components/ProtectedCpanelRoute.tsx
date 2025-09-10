// src/components/ProtectedCpanelRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useSession, isSuperAdmin } from "@/shared/auth";
import React from "react";

/**
 * Guard minimalista:
 * - Requiere sesión y rol SUPERADMIN.
 * - NO usa allowlist por email (la podemos reactivar luego).
 */
export default function ProtectedCpanelRoute({ children }: { children: React.ReactNode }) {
  const s = useSession();
  const loc = useLocation();

  if (!s.ready) return null;

  if (!s.token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${loc.pathname}${loc.search || ""}${loc.hash || ""}` }}
      />
    );
  }

  if (!isSuperAdmin(s)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
