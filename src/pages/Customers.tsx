// partner-web/src/pages/Customers.tsx
import { useEffect, useState } from "react";
import { listCustomers } from "@/shared/api";
import { useSession, isAdmin } from "@/shared/auth";

function maskPhone(p?: string) {
  return p ? p.replace(/.(?=.{4})/g, "•") : "—";
}
function maskEmail(e?: string) {
  if (!e) return "—";
  const [u, d] = e.split("@");
  const uu = u.slice(0, 2) + "•".repeat(Math.max(0, u.length - 2));
  return `${uu}@${d}`;
}

export default function CustomersPage() {
  const { role } = useSession();
  const admin = isAdmin(role);
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listCustomers()
      .then(setRows)
      .catch((e) => setError(e?.response?.data?.message || e.message));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl mb-3">Clientes</h1>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full border">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border-b">Nombre</th>
              <th className="text-left p-2 border-b">Teléfono</th>
              <th className="text-left p-2 border-b">Email</th>
              <th className="text-left p-2 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="p-2 border-b">{c.name}</td>
                <td className="p-2 border-b">
                  {admin ? c.phone || "—" : maskPhone(c.phone)}
                </td>
                <td className="p-2 border-b">
                  {admin ? c.email || "—" : maskEmail(c.email)}
                </td>
                <td className="p-2 border-b">
                  <a
                    className="text-blue-600 underline"
                    href={`/customers/${c.id}`}
                  >
                    Ver
                  </a>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  className="p-4 text-sm text-gray-500"
                  colSpan={4}
                >
                  Sin clientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
