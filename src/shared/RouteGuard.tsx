// src/shared/RouteGuard.tsx
import { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "./auth";

function Splash() {
  // Pantalla mínima mientras hidratamos la sesión
  return (
    <div style={{display:"grid",placeItems:"center",height:"100vh"}}>
      <div style={{opacity:.7, fontSize:14}}>Cargando…</div>
    </div>
  );
}

export default function RouteGuard({ children }: PropsWithChildren) {
  const s = useSession();

  // 1) Aún no sabemos si hay sesión válida → no decidir (sin fetch, sin redirigir)
  if (!s.ready) return <Splash />;

  // 2) Ya hidrató y no hay token → a login
  if (!s.token) return <Navigate to="/login" replace />;

  // 3) Sesión OK → mostrar ruta protegida
  return <>{children}</>;
}
