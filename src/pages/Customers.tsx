import { useQuery } from "@tanstack/react-query";
import { api } from "../shared/api";

type Customer = { id:string; name:string; phone:string; email?:string; tag?:string; };

export default function Customers(){
  const q = useQuery({
    queryKey:["customers"],
    queryFn: async () => (await api.get<Customer[]>("/customers")).data
  });
  if (q.isLoading) return <p>Cargando...</p>;
  if (q.error) return <p className="text-red-600">Error: {(q.error as any).message}</p>;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Clientes</h1>
      <table className="w-full bg-white shadow border">
        <thead className="bg-neutral-100 text-sm">
          <tr>
            <th className="text-left p-2">Nombre</th>
            <th className="text-left p-2">Teléfono</th>
            <th className="text-left p-2">Email</th>
            <th className="text-left p-2">Tag</th>
          </tr>
        </thead>
        <tbody>
          {q.data?.map(c=>(
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
