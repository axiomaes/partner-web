// src/components/ProtectedCpanelRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/shared/auth";
import React from "react";

// Permite configurar por env: VITE_CPANEL_SUPERS="admin@axioma-creativa.es,otro@mail.com"
const ENV_ALLOW = (import.meta as any)?.env?.VITE_CPANEL_SUPERS as string | undefined;
const ALLOWED: string[] = (ENV_ALLOW || "admin@axioma-creativa.es")
  .split(",")
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

export default function ProtectedCpanelRoute({ children }: { children: React.ReactNode }) {
  const { token, role, email, ready } = useSession();
  const loc = useLocation();

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
        state={{ from: `${loc.pathname}${loc.search || ""}` }}
      />
    );
  }

  const emailOk = !!email && ALLOWED.includes(String(email).toLowerCase());
  const roleOk = role === "SUPERADMIN";

  if (!emailOk || !roleOk) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
