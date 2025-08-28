// web/src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { isLoggedIn, hasRole, type UserRole } from "../shared/auth";
import { type ReactNode } from "react";

type Props = {
  roles?: UserRole[]; // ["ADMIN"] o ["ADMIN","BARBER"]
  children: ReactNode;
};

export default function ProtectedRoute({ roles, children }: Props) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (roles && !hasRole(roles)) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}
