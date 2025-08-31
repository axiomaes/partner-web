import { useQuery } from "@tanstack/react-query";
import { Card } from "../components/Card";
import { api } from "../shared/api";
import type { Customer } from "../types/api";

export default function Customers() {
  const { data, isFetching, error } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: async () => (await api.get<Customer[]>("/customers")).data,
  });

  if (error) {
    return <div className="text-sm text-red-600">Error cargando clientes.</div>;
  }

  return (
    <Card title="Clientes">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-4">Nombre</th>
              <th className="py-2 pr-4">Teléfono</th>
              <th className="py-2 pr-4">Visitas</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((c: Customer) => (
              <tr key={c.id} className="border-t border-slate-200">
                <td className="py-2 pr-4">{c.name}</td>
                <td className="py-2 pr-4">{c.phone}</td>
                <td className="py-2 pr-4">{c.visits ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {isFetching && <div className="mt-2 text-xs text-slate-500">Cargando…</div>}
      </div>
    </Card>
  );
}
