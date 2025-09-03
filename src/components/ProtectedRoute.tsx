// partner-web/src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/shared/api";

type Props = {
  roles?: string[];
  children: ReactNode;
};

export default function ProtectedRoute({ roles, children }: Props) {
  const loc = useLocation();

  // Si no hay token, ni consultes la API
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: !!token, // solo consulta si hay token
    retry: false,
  });

  // 1) Resolviendo -> no renderices nada (evita parpadeo)
  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  // 2) Sin token o sin usuario -> a login con next
  if (!token || !me) {
    const next = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  // 3) Rol no permitido
  if (roles && me.role && !roles.includes(me.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4) OK
  return <>{children}</>;
}
