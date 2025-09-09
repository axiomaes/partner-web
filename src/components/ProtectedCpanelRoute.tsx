// src/components/ProtectedCpanelRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/shared/auth";

const ALLOWED = ["admin@axioma-creativa.es"];

export default function ProtectedCpanelRoute({ children }: { children: JSX.Element }) {
  const { token, role, email, ready } = useSession();
  const loc = useLocation();

  if (!ready) return <div className="min-h-[40vh] flex items-center justify-center"><span className="loading loading-spinner" /></div>;
  if (!token) return <Navigate to="/login" state={{ from: loc }} replace />;

  const emailOk = !!email && ALLOWED.includes(String(email).toLowerCase());
  const roleOk = role === "SUPERADMIN";
  if (!emailOk || !roleOk) return <Navigate to="/unauthorized" replace />;

  return children;
}
