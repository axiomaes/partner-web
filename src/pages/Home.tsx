// partner-web/src/pages/Home.tsx
import { Navigate } from "react-router-dom";
import { useSession, isSuperAdmin } from "@/shared/auth";

export default function Home() {
  const s = useSession();

  // Espera a que la sesión esté hidratada antes de decidir
  if (!s.ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-base-200">
        <div className="text-center space-y-3">
          <span className="loading loading-spinner loading-lg" />
          <p className="opacity-70">Axioma Loyalty</p>
        </div>
      </div>
    );
  }

  // Sin token → login
  if (!s.token) return <Navigate to="/login" replace />;

  // SUPERADMIN → CPanel
  if (isSuperAdmin(s)) return <Navigate to="/cpanel" replace />;

  // Staff/negocio → Panel
  return <Navigate to="/app" replace />;
}
