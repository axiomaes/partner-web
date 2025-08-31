import { useQuery } from "@tanstack/react-query";
import { Card } from "../components/Card";
import { api } from "../shared/api";
import type { Reward } from "../types/api";

export default function Rewards() {
  const { data, isFetching, error } = useQuery<Reward[]>({
    queryKey: ["rewards"],
    queryFn: async () => (await api.get<Reward[]>("/rewards")).data,
  });

  if (error) {
    return <div className="text-sm text-red-600">Error cargando recompensas.</div>;
  }

  const rewards = data ?? [];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rewards.map((r: Reward) => (
        <Card key={r.id} title={r.name}>
          {r.description ? (
            <div className="text-sm text-slate-700">{r.description}</div>
          ) : (
            <div className="text-sm text-slate-500">Sin descripción.</div>
          )}
          <div className="mt-2 text-xs text-slate-500">Umbral: {r.threshold} pts</div>
        </Card>
      ))}
      {isFetching && <div className="text-sm text-slate-500">Cargando…</div>}
      {!isFetching && rewards.length === 0 && (
        <div className="text-sm text-slate-500">Sin recompensas aún.</div>
      )}
    </div>
  );
}
