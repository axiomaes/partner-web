import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { getToken, getUser } from "@/shared/session";

type Props = {
  roles?: string[];           // p.ej. ["ADMIN","OWNER","SUPERADMIN"]
  children: ReactNode;
};

export default function ProtectedRoute({ roles, children }: Props) {
  const location = useLocation();
  const token = getToken();
  const user  = getUser();

  // Si no hay sesión -> al login, recordando de dónde venía
  if (!token || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // Si hay restricción de roles y el usuario no cumple -> unauthorized
  if (roles && user.role && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
