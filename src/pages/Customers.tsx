// partner-web/src/pages/Customers.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listCustomers } from "@/shared/api";
import { useSession, isAdmin } from "@/shared/auth";

function maskPhone(p?: string) {
  return p ? p.replace(/.(?=.{4})/g, "•") : "—";
}
function maskEmail(e?: string) {
  if (!e) return "—";
  const [u = "", d = ""] = e.split("@");
  const uu = u.slice(0, 2) + "•".repeat(Math.max(0, u.length - 2));
  return `${uu}@${d}`;
}

export default function CustomersPage() {
  const { role } = useSession();
  const admin = isAdmin(role);

  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listCustomers()
      .then((data) => {
        if (!alive) return;
        setRows(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e?.response?.data?.message || e.message || "No se pudo cargar el listado.");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clientes</h1>
        <Link to="/app/customers/new" className="btn btn-primary btn-sm">
          Nuevo cliente
        </Link>
      </div>

      {error && (
        <div className="alert alert-warning">
          <span>{error}</span>
        </div>
      )}

      <div className="card">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th className="hidden sm:table-cell">Email</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4}>
                      <div className="p-4 flex items-center gap-2">
                        <span className="loading loading-spinner" />
                        Cargando…
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && rows.map((c) => (
                  <tr key={c.id} className="hover">
                    <td>{c.name}</td>
                    <td>{admin ? (c.phone || "—") : maskPhone(c.phone)}</td>
                    <td className="hidden sm:table-cell">
                      {admin ? (c.email || "—") : maskEmail(c.email)}
                    </td>
                    <td>
                      {/* ✅ usar /app/... para heredar el layout */}
                      <Link to={`/app/customers/${c.id}`} className="link">
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}

                {!loading && rows.length === 0 && !error && (
                  <tr>
                    <td colSpan={4}>
                      <div className="p-4 text-sm text-gray-500">Sin clientes.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
