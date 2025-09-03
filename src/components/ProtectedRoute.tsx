import { Navigate, useLocation } from "react-router-dom";
import { ReactNode, useMemo } from "react";

type Props = {
  roles?: Array<"ADMIN" | "BARBER" | "OWNER" | "SUPERADMIN">;
  children: ReactNode;
};

type Session = {
  email: string;
  role: "ADMIN" | "BARBER" | "OWNER" | "SUPERADMIN";
  // puedes añadir más campos si los usas luego
};

const SESSION_KEY = "axioma.session";

export default function ProtectedRoute({ roles, children }: Props) {
  const { pathname } = useLocation();

  const session: Session | null = useMemo(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  }, [pathname]);

  // si no hay sesión -> al login
  if (!session) {
    return <Navigate to="/login" replace state={{ from: pathname }} />;
  }

  // si hay restricción de roles y no coincide -> unauthorized
  if (roles && !roles.includes(session.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
