// src/pages/CustomerDetail.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import { useSession, isAdmin, isOwner, isSuperAdmin } from "@/shared/auth";
import { api, publicCustomerQrUrl, addVisit, getCustomerVisits } from "@/shared/api";
import CustomerVisitCard from "@/components/CustomerVisitCard";

/** ---- Tipos ---- */
type Customer = {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  birthday?: string | null; // YYYY-MM-DD
  visitsCount?: number | null;
  createdAt?: string | null;
  [k: string]: any;
};

type VisitRow = { id: string; visitedAt: string; notes?: string | null };

/** ---- Helpers ---- */
const maskPhone = (p?: string | null) => {
  if (!p) return "—";
  const d = p.replace(/\D/g, "");
  if (d.length <= 4) return "•••";
  return `${d.slice(0, 2)}•••${d.slice(-2)}`;
};
const maskEmail = (e?: string | null) => {
  if (!e) return "—";
  const [u, dom] = e.split("@");
  if (!dom) return "—";
  const u2 = u.length <= 2 ? "••" : u[0] + "••" + u.slice(-1);
  return `${u2}@${dom}`;
};
function isDuplicateVisitError(e: any): boolean {
  const msg = e?.response?.data?.message || e?.message || "";
  return e?.response?.status === 409 || /same\s*day|mismo\s*d[ií]a|already.*today/i.test(msg);
}
const waHref = (phone?: string | null, text?: string) => {
  const digits = (phone || "").replace(/\D/g, "");
  const t = text || "¡Feliz cumpleaños! 🎉 Gracias por elegirnos.";
  return `https://wa.me/${digits}?text=${encodeURIComponent(t)}`;
};

/** Helpers para filtro mensual (historial) */
const monthKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const monthLabel = (key: string) => {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
};

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const { role } = useSession();
  const canSeeContact = isAdmin(role) || isOwner(role) || isSuperAdmin(role);
  const showIdTo = isAdmin(role) || isSuperAdmin(role); // ID solo para ADMIN y SUPERADMIN
  const canAddVisit = useMemo(
    () => ["BARBER", "ADMIN", "OWNER", "SUPERADMIN"].includes(String(role || "")),
    [role]
  );
  const isOwnerRole = isOwner(role);

  const [c, setC] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(false);

  // filtro de historial por mes (YYYY-MM | "all")
  const [monthFilter, setMonthFilter] = useState<string>("all");

  // override OWNER modal
  const [needsOverride, setNeedsOverride] = useState<null | { action: () => Promise<void> }>(null);

  async function loadCustomer() {
    if (!id) return;
    const r = await api.get(`/customers/${encodeURIComponent(id)}`, { validateStatus: () => true });
    if (r.status >= 200 && r.status < 300) {
      setC(r.data as Customer);
    } else {
      throw new Error(r.data?.message || `HTTP ${r.status}`);
    }
  }
  async function loadVisits() {
    if (!id) return;
    setLoadingVisits(true);
    try {
      const rows = await getCustomerVisits(id);
      const arr: VisitRow[] = (Array.isArray(rows) ? rows : rows?.rows ?? rows ?? []) as any[];
      // Más reciente primero
      arr.sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime());
      setVisits(arr);
    } finally {
      setLoadingVisits(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    let live = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        await loadCustomer();
        await loadVisits();
      } catch (e: any) {
        if (!live) return;
        setErr(e?.response?.data?.message || e?.message || "No se pudo cargar el cliente.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function tryRegister() {
    if (!id) return;
    setMsg(null);
    try {
      setBusy(true);
      await addVisit(id, "Visita registrada desde detalle");
      setMsg("✅ Visita registrada.");
      await Promise.all([loadCustomer(), loadVisits()]);
    } catch (e: any) {
      if (isDuplicateVisitError(e)) {
        setMsg("⚠️ Ya se registró una visita hoy. Requiere autorización del OWNER.");
        setNeedsOverride({
          action: async () => {
            await addVisit(id, "Visita (override OWNER)");
            await Promise.all([loadCustomer(), loadVisits()]);
          },
        });
      } else {
        setMsg("❌ " + (e?.response?.data?.message || e?.message || "No se pudo registrar la visita."));
      }
    } finally {
      setBusy(false);
    }
  }

  const title = c?.name ? `Cliente · ${c.name}` : "Cliente";

  // === Historial: opciones de meses y lista filtrada (máx 15) ===
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    for (const v of visits) set.add(monthKey(v.visitedAt));
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1)); // desc
  }, [visits]);

  const filteredVisits = useMemo(() => {
    const base = monthFilter === "all" ? visits : visits.filter((v) => monthKey(v.visitedAt) === monthFilter);
    return base.slice(0, 15); // solo últimas 15
  }, [visits, monthFilter]);

  return (
    <AppLayout title={title} subtitle="Ficha del cliente y acciones rápidas.">
      {/* Barra superior */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link to="/app/customers/list" className="btn btn-ghost">
          ← Volver al listado
        </Link>
        {canAddVisit && (
          <button className={`btn btn-primary ${busy ? "loading" : ""}`} disabled={busy} onClick={tryRegister}>
            {busy ? "" : "Añadir visita"}
          </button>
        )}
        <Link to={`/staff/checkin?cid=${encodeURIComponent(id || "")}`} className="btn btn-outline">
          Abrir en Check-in
        </Link>
        {c?.phone && (
          <a className="btn btn-ghost" href={waHref(c.phone)} target="_blank" rel="noreferrer">
            Saludar por WhatsApp
          </a>
        )}
      </div>

      {msg && (
        <div className={`alert ${msg.startsWith("❌") ? "alert-warning" : "alert-info"} mb-4`}>
          <span>{msg}</span>
        </div>
      )}
      {err && (
        <div className="alert alert-warning mb-4">
          <span>{err}</span>
        </div>
      )}

      {/* Modal Override */}
      <input type="checkbox" className="modal-toggle" checked={!!needsOverride} readOnly />
      {needsOverride && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-2">Se necesita autorización</h3>
            <p className="text-sm opacity-80">
              Ya existe una visita hoy para este cliente. Solo un <b>OWNER</b> puede autorizar un segundo registro.
            </p>
            <div className="modal-action">
              <button className="btn" onClick={() => setNeedsOverride(null)}>
                Cancelar
              </button>
              {isOwnerRole ? (
                <button
                  className={`btn btn-primary ${busy ? "loading" : ""}`}
                  disabled={busy}
                  onClick={async () => {
                    try {
                      setBusy(true);
                      await needsOverride.action();
                      setNeedsOverride(null);
                      setMsg("✅ Visita registrada con autorización del OWNER.");
                    } catch (e: any) {
                      setMsg("❌ " + (e?.response?.data?.message || e?.message || "No se pudo autorizar."));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {busy ? "" : "Autorizar y registrar"}
                </button>
              ) : (
                <span className="text-xs opacity-70">Inicie sesión un OWNER para autorizar.</span>
              )}
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setNeedsOverride(null)} />
        </div>
      )}

      {/* Contenido */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Datos */}
        <section className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h3 className="card-title">Datos del cliente</h3>
            {loading ? (
              <div className="space-y-2">
                <div className="skeleton h-6 w-48" />
                <div className="skeleton h-4 w-72" />
                <div className="skeleton h-4 w-40" />
                <div className="skeleton h-4 w-60" />
              </div>
            ) : !c ? (
              <p className="opacity-70">No se encontró el cliente.</p>
            ) : (
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="opacity-70">Nombre</dt>
                <dd className="text-right">{c.name || "—"}</dd>

                <dt className="opacity-70">Teléfono</dt>
                <dd className="text-right">{canSeeContact ? c.phone || "—" : maskPhone(c.phone)}</dd>

                <dt className="opacity-70">Email</dt>
                <dd className="text-right">{canSeeContact ? c.email || "—" : maskEmail(c.email)}</dd>

                <dt className="opacity-70">Cumpleaños</dt>
                <dd className="text-right">
                  {c.birthday ? new Date(c.birthday + "T00:00:00").toLocaleDateString() : "—"}
                </dd>

                <dt className="opacity-70">Visitas totales</dt>
                <dd className="text-right">{c.visitsCount ?? "—"}</dd>

                <dt className="opacity-70">Alta</dt>
                <dd className="text-right">{c.createdAt ? new Date(c.createdAt).toLocaleString() : "—"}</dd>

                {showIdTo && (
                  <>
                    <dt className="opacity-70">ID</dt>
                    <dd className="text-right">
                      <span className="font-mono text-xs">{c.id}</span>
                    </dd>
                  </>
                )}
              </dl>
            )}
          </div>
        </section>

        {/* QR */}
        <section className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body items-center text-center">
            <h3 className="card-title">QR del cliente</h3>
            {loading ? (
              <div className="skeleton h-56 w-56" />
            ) : !c ? (
              <div className="opacity-70 text-sm">No disponible.</div>
            ) : (
              <>
                <div className="p-4 rounded-box border border-base-300 bg-base-200">
                  <img
                    src={publicCustomerQrUrl(c.id)}
                    alt="QR del cliente"
                    className="w-56 h-56 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.opacity = "0.4";
                    }}
                  />
                </div>
                <div className="join mt-4">
                  {(isOwner(role) || isAdmin(role) || isSuperAdmin(role)) && (
                    <a
                      className="btn btn-primary join-item"
                      href={publicCustomerQrUrl(c.id)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir PNG
                    </a>
                  )}
                  <button className="btn join-item" onClick={() => nav(-1)}>
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Tarjeta de visitas (componente nuevo) */}
        <div className="lg:col-span-2">
          {id && (
            <CustomerVisitCard
              customerId={id}
              onChanged={() => {
                // Si quieres refrescar totales tras sumar, vuelve a cargar datos básicos:
                loadCustomer();
              }}
            />
          )}
        </div>

        {/* Tabla de visitas (scroll + filtro mes, máx 15) */}
        <section className="card bg-base-100 shadow-sm border border-base-200 lg:col-span-2">
          <div className="card-body">
            <div className="flex items-center justify-between gap-3">
              <h3 className="card-title">Historial de visitas</h3>
              <div className="flex items-center gap-2">
                <label className="text-sm opacity-70">Mes:</label>
                <select
                  className="select select-sm select-bordered"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                >
                  <option value="all">Todos</option>
                  {monthOptions.map((m) => (
                    <option key={m} value={m}>
                      {monthLabel(m)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loadingVisits ? (
              <div className="flex items-center gap-2">
                <span className="loading loading-spinner" />
                Cargando…
              </div>
            ) : filteredVisits.length === 0 ? (
              <div className="opacity-70 text-sm">Sin visitas registradas.</div>
            ) : (
              <div className="rounded-box border border-base-300 max-h-80 overflow-y-auto">
                <table className="table table-compact w-full">
                  <thead className="bg-base-200 sticky top-0 z-10">
                    <tr>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th className="hidden md:table-cell">Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVisits.map((v) => {
                      const d = new Date(v.visitedAt);
                      return (
                        <tr key={v.id}>
                          <td>{d.toLocaleDateString()}</td>
                          <td>{d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                          <td className="hidden md:table-cell">{v.notes || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loadingVisits && filteredVisits.length > 0 && (
              <div className="text-xs opacity-70 mt-2">
                Mostrando {filteredVisits.length} de{" "}
                {monthFilter === "all"
                  ? Math.min(15, visits.length)
                  : Math.min(15, visits.filter((v) => monthKey(v.visitedAt) === monthFilter).length)}{" "}
                visitas.
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
