// src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useSession, hasRole, type UserRole } from "@/shared/auth";

type Props = { roles: UserRole[]; to?: string; children: JSX.Element };

export default function ProtectedRoute({ roles, to = "/unauthorized", children }: Props) {
  const s = useSession();
  const loc = useLocation();

  if (!s.ready) return null;               // evita “parpadeo”
  if (!s.token) {
    return (
      <Navigate to="/login" replace state={{ from: loc.pathname + loc.search + loc.hash }} />
    );
  }
  if (!hasRole(s, roles)) return <Navigate to={to} replace />;

  return children;
}
