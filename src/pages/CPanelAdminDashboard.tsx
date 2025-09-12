import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import { api } from "@/shared/api";

type Biz = {
  id: string;
  name: string;
  status: "trial" | "active" | "suspended" | "cancelled" | string;
  createdAt?: string;
};

export default function CPanelAdminDashboard() {
  const [rows, setRows] = useState<Biz[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");
    api
      .get("/cp/businesses", { validateStatus: () => true })
      .then((r) => {
        if (!alive) return;
        if (r.status >= 200 && r.status < 300) setRows(r.data as Biz[]);
        else setErr("No se pudo cargar el listado de negocios (CP).");
      })
      .catch((e) => alive && setErr(e?.response?.data?.message || e?.message || "Error de red"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <AppLayout title="CPanel — Negocios" subtitle="Superadmin">
      {err && <div className="alert alert-warning mb-4"><span>{err}</span></div>}

      <div className="overflow-x-auto rounded-box border border-base-300">
        <table className="table table-compact w-full">
          <thead className="bg-base-200 sticky top-0 z-10">
            <tr>
              <th>Negocio</th>
              <th className="hidden sm:table-cell">Estado</th>
              <th className="hidden sm:table-cell">Creado</th>
              <th className="w-1 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4}>
                  <div className="p-4 flex items-center gap-2">
                    <span className="loading loading-spinner" />
                    Cargando…
                  </div>
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((b) => (
                <tr key={b.id} className="hover">
                  <td className="font-medium">{b.name}</td>
                  <td className="hidden sm:table-cell">
                    <span className="badge">{b.status}</span>
                  </td>
                  <td className="hidden sm:table-cell">{b.createdAt ? new Date(b.createdAt).toLocaleString("es-ES") : "—"}</td>
                  <td className="text-right">
                    <div className="join">
                      <Link to={`/app/customers?businessId=${encodeURIComponent(b.id)}`} className="btn btn-sm btn-primary join-item">
                        Clientes
                      </Link>
                      <Link to="/app/admin" className="btn btn-sm btn-ghost join-item">
                        Panel negocio
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="p-4 text-sm opacity-70">Sin negocios.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
