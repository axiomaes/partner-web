import AppLayout from "@/layout/AppLayout";
import { useSession } from "@/shared/auth";

export default function Dashboard() {
  const s = useSession();
  const first = (s.name || s.email || "").split(" ")[0] || "¡hola!";
  return (
    <AppLayout title="Panel" subtitle="Resumen general">
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title">Bienvenido, {first}</h3>
          <p className="opacity-70 text-sm">
            Aquí verás tus métricas y accesos rápidos.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
