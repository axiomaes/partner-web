// partner-web/src/pages/Dashboard.tsx
import AppLayout from "@/layout/AppLayout";
import { useSession } from "@/shared/auth";

export default function Dashboard() {
  const { user } = useSession();

  return (
    <AppLayout title="Panel" subtitle="Resumen general">
      <div className="space-y-3">
        <p className="text-sm opacity-70">
          Bienvenido{user?.name ? `, ${user.name}` : ""}.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title text-base">Clientes</h3>
              <p className="text-sm opacity-70">Accede al listado y gestiona fichas.</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title text-base">Visitas</h3>
              <p className="text-sm opacity-70">Registra visitas y recompensas.</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title text-base">Campañas</h3>
              <p className="text-sm opacity-70">Comunicación y segmentaciones.</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
