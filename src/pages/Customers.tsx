import { useQuery } from "@tanstack/react-query";
import { api } from "../shared/api";

type Customer = { id: string; name: string; phone: string; email?: string; tag?: string };

export default function Customers() {
  const q = useQuery({
    queryKey: ["customers"],
    queryFn: async () => (await api.get<Customer[]>("/customers")).data,
  });
  if (q.isLoading) return <p>Cargando...</p>;
  if (q.error) return <p className="text-red-600">Error: {(q.error as any).message}</p>;
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Clientes</h1>
      <table className="w-full border bg-white shadow">
        <thead className="bg-neutral-100 text-sm">
          <tr>
            <th className="p-2 text-left">Nombre</th>
            <th className="p-2 text-left">Teléfono</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Tag</th>
          </tr>
        </thead>
        <tbody>
          {q.data?.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="p-2">{c.name}</td>
              <td className="p-2">{c.phone}</td>
              <td className="p-2">{c.email ?? "—"}</td>
              <td className="p-2">{c.tag ?? "NONE"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
