// partner-web/src/pages/Customers.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listCustomers, deleteCustomer } from "@/shared/api";
import { useSession, isAdmin } from "@/shared/auth";
import AppLayout from "@/layout/AppLayout";

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
  const canCreate = ["ADMIN", "BARBER", "OWNER", "SUPERADMIN"].includes(
    (role || "").toString()
  );
  const canDelete = ["ADMIN", "OWNER", "SUPERADMIN"].includes(
    (role || "").toString()
  );

  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    listCustomers()
      .then((data) => {
        if (!alive) return;
        setRows(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!alive) return;
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "No se pudo cargar el listado."
        );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const term = q.toLowerCase();
    return rows.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      return name.includes(term) || phone.includes(term) || email.includes(term);
    });
  }, [rows, q]);

  async function onDelete(id: string) {
    if (!canDelete) return;
    const row = rows.find((r) => r.id === id);
    const label = row?.name || "este cliente";
    const ok = window.confirm(`¿Eliminar definitivamente ${label}?`);
    if (!ok) return;

    try {
      setDeletingId(id);
      await deleteCustomer(id);
      setRows((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "No se pudo eliminar el cliente."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppLayout title="Clientes" subtitle="Gestión de clientes registrados">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <div className="join w-full md:w-auto">
          <div className="join-item input input-bordered flex items-center gap-2 w-full md:w-80">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-4 opacity-60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeWidth="2"
                d="m21 21-3.5-3.5M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
              />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="text"
              placeholder="Buscar por nombre, teléfono o email…"
              className="grow"
            />
          </div>
        </div>

        {canCreate && (
          <div className="flex gap-2 justify-end">
            <Link to="/app/customers/new" className="btn btn-primary">
              Nuevo cliente
            </Link>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-warning mb-4">
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-box border border-base-300">
        <table className="table table-zebra table-compact w-full">
          <thead className="bg-base-200 sticky top-0 z-10">
            <tr>
              <th className="w-[35%]">Nombre</th>
              <th className="w-[20%]">Teléfono</th>
              <th className="hidden sm:table-cell w-[30%]">Email</th>
              <th className="w-[15%] text-right">Acciones</th>
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

            {!loading &&
              filtered.map((c) => (
                <tr key={c.id} className="hover">
                  <td className="font-medium">{c.name}</td>
                  <td>{admin ? c.phone || "—" : maskPhone(c.phone)}</td>
                  <td className="hidden sm:table-cell">
                    {admin ? c.email || "—" : maskEmail(c.email)}
                  </td>
                  <td className="text-right">
                    <div className="join">
                      <Link
                        to={`/app/customers/${c.id}`}
                        className="btn btn-ghost btn-xs join-item"
                      >
                        Ver
                      </Link>
                      {canDelete && (
                        <button
                          onClick={() => onDelete(c.id)}
                          className={`btn btn-error btn-xs join-item ${
                            deletingId === c.id ? "loading" : ""
                          }`}
                          disabled={!!deletingId}
                          title="Eliminar cliente"
                        >
                          {deletingId === c.id ? "" : "Eliminar"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

            {!loading && filtered.length === 0 && !error && (
              <tr>
                <td colSpan={4}>
                  <div className="p-6 text-sm text-base-content/60">
                    {q
                      ? "No hay resultados para tu búsqueda."
                      : "Sin clientes."}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
