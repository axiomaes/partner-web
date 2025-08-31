import { useQuery } from "@tanstack/react-query";
import { Card } from "../components/Card";
import { Stat } from "../components/Stat";
import { api } from "../shared/api";

export default function Home() {
  const { data } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => (await api.get("/stats/overview")).data,
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Clientes" value={data?.customers ?? "—"} />
      <Stat label="Visitas (30d)" value={data?.visits30d ?? "—"} />
      <Stat label="Recompensas" value={data?.rewards ?? "—"} />
      <Stat label="Activas hoy" value={data?.activeToday ?? "—"} />
      <div className="sm:col-span-2 lg:col-span-4">
        <Card title="Actividad reciente">
          <div className="text-sm text-slate-600">Sin datos aún.</div>
        </Card>
      </div>
    </div>
  );
}
