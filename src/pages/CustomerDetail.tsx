// partner-web/src/pages/CustomerDetail.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { api, addVisit, getCustomerRewards, getCustomerVisits } from "@/shared/api";
import { useSession, isAdmin } from "@/shared/auth";
import AppLayout from "@/layout/AppLayout";

type Customer = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  tag?: "NONE" | "NEW" | "FRIEND" | "VIP";
};

type Visit = { id: string; visitedAt: string; notes?: string | null };
type Reward = {
  id: string;
  status: "PENDING" | "REDEEMED" | "EXPIRED";
  note?: string | null;
  kind?: string | null;
};

function maskPhone(p?: string | null) {
  return p ? p.replace(/.(?=.{4})/g, "•") : "—";
}
function maskEmail(e?: string | null) {
  if (!e) return "—";
  const [u = "", d = ""] = e.split("@");
  const uu = u.slice(0, 2) + "•".repeat(Math.max(0, u.length - 2));
  return `${uu}@${d}`;
}
function rewardClass(s: Reward["status"]) {
  switch (s) {
    case "PENDING":
      return "badge badge-warning";
    case "REDEEMED":
      return "badge badge-success";
    case "EXPIRED":
      return "badge badge-ghost";
    default:
      return "badge";
  }
}
function tagLabel(t?: Customer["tag"]) {
  return t ?? "NONE";
}

export default function CustomerDetail() {
  const { id = "" } = useParams();
  const { role } = useSession();
  const admin = isAdmin(role);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>("");

  const [msg, setMsg] = useState<string>("");

  // Filtros visuales
  const [rewardFilter, setRewardFilter] = useState<"" | Reward["status"]>("");
  const [queryVisit, setQueryVisit] = useState<string>("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [c, rw, vs] = await Promise.all([
        api.get(`/customers/${encodeURIComponent(id)}`).then((r) => r.data as Customer),
        getCustomerRewards(id).catch(() => [] as Reward[]),
        getCustomerVisits(id).catch(() => [] as Visit[]),
      ]);
      setCustomer(c);
      setRewards(rw);
      setVisits(vs);
    } catch (e: any) {
      setCustomer(null);
      setRewards([]);
      setVisits([]);
      setLoadError(e?.response?.data?.message || e?.message || "No se pudo cargar el cliente.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setLoadError("Cliente no especificado.");
      setLoading(false);
      return;
    }
    fetchAll();
  }, [id, fetchAll]);

  const onAddVisit = async () => {
    setMsg("");
    try {
      const r = await addVisit(id, "Visita desde dashboard");
      const text = `Visita creada · Progreso ${r?.progress?.count ?? "?"}/${r?.progress?.target ?? "?"}${
        r?.newReward?.id ? ` · Nueva recompensa: ${r.newReward.id}` : ""
      }`;
      setMsg(text);
      // refrescar (no bloquea la UI)
      getCustomerRewards(id).then(setRewards).catch(() => {});
      getCustomerVisits(id).then(setVisits).catch(() => {});
    } catch (e: any) {
      setMsg(e?.response?.data?.message || e.message || "Error al crear visita");
    }
  };

  // Derivados UI
  const totalVisits = visits.length;

  const filteredRewards = useMemo(
    () => (rewardFilter ? rewards.filter((r) => r.status === rewardFilter) : rewards),
    [rewards, rewardFilter]
  );

  const filteredVisits = useMemo(() => {
    const q = queryVisit.trim().toLowerCase();
    if (!q) return visits;
    return visits.filter((v) => {
      const dt = new Date(v.visitedAt).toLocaleString();
      return dt.toLowerCase().includes(q) || (v.notes ?? "").toLowerCase().includes(q);
    });
  }, [visits, queryVisit]);

  // ===== Estados de carga / error con layout unificado =====
  if (loading) {
    return (
      <AppLayout title="Cliente" subtitle="Cargando detalle…">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <span className="loading loading-spinner" />
            <span>Cargando cliente…</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (loadError || !customer) {
    return (
      <AppLayout title="Cliente" subtitle="Detalle no disponible">
        <div className="flex items-center justify-between mb-4">
          <div className="breadcrumbs text-sm">
            <ul>
              <li>
                <Link to="/app/customers">Clientes</Link>
              </li>
              <li className="font-medium">Detalle</li>
            </ul>
          </div>
          <Link to="/app/customers" className="btn btn-ghost btn-sm">
            ← Volver
          </Link>
        </div>

        <div className="alert alert-warning mb-4">
          <span>{loadError || "No se encontró el cliente."}</span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="btn btn-primary">
            Reintentar
          </button>
        </div>
      </AppLayout>
    );
  }

  const phoneDisplay = admin ? customer.phone || "—" : maskPhone(customer.phone);
  const emailDisplay = admin ? customer.email || "—" : maskEmail(customer.email);

  return (
    <AppLayout title={customer.name} subtitle="Detalle de cliente">
      {/* Breadcrumb + Acciones */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="breadcrumbs text-sm">
          <ul>
            <li>
              <Link to="/app/customers">Clientes</Link>
            </li>
            <li className="font-medium">{customer.name}</li>
          </ul>
        </div>
        <Link to="/app/customers" className="btn btn-ghost btn-sm">
          ← Volver
        </Link>
      </div>

      {/* Top: Perfil + Stats/acciones */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Card: Datos del cliente */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <h2 className="card-title">Cliente</h2>
              <div className="badge badge-outline">{tagLabel(customer.tag)}</div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mt-2">
              <div>
                <div className="label">
                  <span className="label-text">Nombre</span>
                </div>
                <div className="font-medium">{customer.name}</div>
              </div>

              <div>
                <div className="label">
                  <span className="label-text">Teléfono</span>
                </div>
                <div className="font-medium">{phoneDisplay}</div>
                {!admin && (
                  <div className="text-xs opacity-60 mt-1">
                    Oculto para staff. El administrador puede ver el dato completo.
                  </div>
                )}
              </div>

              <div>
                <div className="label">
                  <span className="label-text">Email</span>
                </div>
                <div className="font-medium">{emailDisplay}</div>
              </div>

              <div>
                <div className="label">
                  <span className="label-text">ID</span>
                </div>
                <div className="font-mono text-xs opacity-70 break-all">{customer.id}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card: Puntos/Visitas + acción */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body gap-4">
            <div className="flex items-center justify-between">
              <h2 className="card-title">Puntos y visitas</h2>
              <button onClick={onAddVisit} className="btn btn-primary btn-sm">
                Añadir visita
              </button>
            </div>

            {msg && (
              <div className="alert alert-info py-2">
                <span className="text-sm">{msg}</span>
              </div>
            )}

            <div className="stats shadow-sm">
              <div className="stat">
                <div className="stat-title">Visitas totales</div>
                <div className="stat-value text-primary">{totalVisits}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Recompensas</div>
                <div className="stat-value">{rewards.length}</div>
              </div>
            </div>

            {/* Filtros visuales */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Filtro de recompensas</span>
                </label>
                <select
                  className="select select-bordered"
                  value={rewardFilter}
                  onChange={(e) => setRewardFilter(e.target.value as any)}
                >
                  <option value="">Todas</option>
                  <option value="PENDING">Pendientes</option>
                  <option value="REDEEMED">Canjeadas</option>
                  <option value="EXPIRED">Expiradas</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Buscar en visitas</span>
                </label>
                <input
                  className="input input-bordered"
                  placeholder="fecha o notas…"
                  value={queryVisit}
                  onChange={(e) => setQueryVisit(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recompensas */}
      <div className="card bg-base-100 shadow-sm mb-6">
        <div className="card-body">
          <h3 className="card-title">Recompensas</h3>
          {filteredRewards.length ? (
            <div className="overflow-x-auto rounded-box border border-base-300">
              <table className="table table-zebra table-compact w-full">
                <thead className="bg-base-200 sticky top-0 z-10">
                  <tr>
                    <th>ID / Nota</th>
                    <th>Estado</th>
                    <th>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRewards.map((r) => (
                    <tr key={r.id}>
                      <td className="align-top">
                        <div className="font-medium">{r.note || r.kind || "—"}</div>
                        <div className="text-xs opacity-60 font-mono break-all">{r.id}</div>
                      </td>
                      <td className="align-top">
                        <span className={rewardClass(r.status)}>{r.status}</span>
                      </td>
                      <td className="align-top">{r.kind || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm opacity-70">Sin recompensas</div>
          )}
        </div>
      </div>

      {/* Visitas */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h3 className="card-title">Visitas</h3>
          {filteredVisits.length ? (
            <div className="overflow-x-auto rounded-box border border-base-300">
              <table className="table table-zebra table-compact w-full">
                <thead className="bg-base-200 sticky top-0 z-10">
                  <tr>
                    <th>Fecha</th>
                    <th>Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisits.map((v) => (
                    <tr key={v.id}>
                      <td className="whitespace-nowrap">
                        {new Date(v.visitedAt).toLocaleString()}
                      </td>
                      <td>{v.notes || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm opacity-70">Sin visitas</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
