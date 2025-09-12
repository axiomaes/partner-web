// src/pages/CustomerDetail.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import { useSession, isAdmin, isOwner, isSuperAdmin } from "@/shared/auth";
import { api, publicCustomerQrUrl, addVisit } from "@/shared/api";

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

/** Progreso dentro del ciclo de 10 visitas */
function progress10(total?: number | null) {
  const v = Math.max(0, Number(total || 0));
  const cycle = v % 10; // 0..9
  const filled = cycle === 0 && v > 0 ? 10 : cycle;
  const to5 = Math.max(0, 5 - filled);
  const to10 = Math.max(0, 10 - filled);
  return { v, filled, to5, to10 };
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const { role } = useSession();

  // Contacto completo: ADMIN / OWNER / SUPERADMIN
  const canSeeContact = isAdmin(role) || isOwner(role) || isSuperAdmin(role);
  // ID del cliente: **solo** ADMIN / SUPERADMIN (oculto para OWNER y BARBER)
  const canSeeId = isAdmin(role) || isSuperAdmin(role);

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

  // override OWNER modal
  const [needsOverride, setNeedsOverride] = useState<null | { action: () => Promise<void> }>(null);

  useEffect(() => {
    if (!id) return;
    let live = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const r = await api.get(`/customers/${encodeURIComponent(id)}`);
        if (!live) return;
        setC(r.data as Customer);
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
  }, [id]);

  async function tryRegister() {
    if (!id) return;
    setMsg(null);
    try {
      setBusy(true);
      await addVisit(id, "Visita registrada desde detalle");
      setMsg("✅ Visita registrada.");
      setC((old) => (old ? { ...old, visitsCount: (Number(old.visitsCount || 0) + 1) } : old));
    } catch (e: any) {
      if (isDuplicateVisitError(e)) {
        setMsg("⚠️ Ya se registró una visita hoy. Requiere autorización del OWNER.");
        setNeedsOverride({
          action: async () => {
            await addVisit(id, "Visita (override OWNER)", { force: true });
            setC((old) => (old ? { ...old, visitsCount: (Number(old.visitsCount || 0) + 1) } : old));
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
  const prog = progress10(c?.visitsCount);

  return (
    <AppLayout title={title} subtitle="Ficha del cliente y acciones rápidas.">
      {/* Barra superior */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link to="/app/customers/list" className="btn btn-ghost">
          ← Volver al listado
        </Link>
        {canAddVisit && (
          <button
            className={`btn btn-primary ${busy ? "loading" : ""}`}
            disabled={busy}
            onClick={tryRegister}
          >
            {busy ? "" : "Añadir visita"}
          </button>
        )}
        <Link
          to={`/staff/checkin?cid=${encodeURIComponent(id || "")}`}
          className="btn btn-outline"
        >
          Abrir en Check-in
        </Link>
        {c?.phone && (
          <a
            className="btn btn-ghost"
            href={waHref(c.phone)}
            target="_blank"
            rel="noreferrer"
          >
            Saludar por WhatsApp
          </a>
        )}
      </div>

      {msg && (
        <div
          className={`alert ${
            msg.startsWith("❌") ? "alert-warning" : "alert-info"
          } mb-4`}
        >
          <span>{msg}</span>
        </div>
      )}
      {err && (
        <div className="alert alert-warning mb-4">
          <span>{err}</span>
        </div>
      )}

      {/* Modal Override */}
      <input
        type="checkbox"
        className="modal-toggle"
        checked={!!needsOverride}
        readOnly
      />
      {needsOverride && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-2">Se necesita autorización</h3>
            <p className="text-sm opacity-80">
              Ya existe una visita hoy para este cliente. Solo un <b>OWNER</b> puede
              autorizar un segundo registro.
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
                      setMsg(
                        "❌ " +
                          (e?.response?.data?.message ||
                            e?.message ||
                            "No se pudo autorizar.")
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {busy ? "" : "Autorizar y registrar"}
                </button>
              ) : (
                <span className="text-xs opacity-70">
                  Inicie sesión un OWNER para autorizar.
                </span>
              )}
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setNeedsOverride(null)}
          />
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
                <dd className="text-right">
                  {canSeeContact ? c.phone || "—" : maskPhone(c.phone)}
                </dd>

                <dt className="opacity-70">Email</dt>
                <dd className="text-right">
                  {canSeeContact ? c.email || "—" : maskEmail(c.email)}
                </dd>

                <dt className="opacity-70">Cumpleaños</dt>
                <dd className="text-right">
                  {c.birthday
                    ? new Date(c.birthday + "T00:00:00").toLocaleDateString()
                    : "—"}
                </dd>

                <dt className="opacity-70">Visitas totales</dt>
                <dd className="text-right">{c.visitsCount ?? "—"}</dd>

                <dt className="opacity-70">Alta</dt>
                <dd className="text-right">
                  {c.createdAt ? new Date(c.createdAt).toLocaleString() : "—"}
                </dd>

                {/* ID SOLO para ADMIN / SUPERADMIN */}
                {canSeeId && (
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

        {/* Tarjeta de visitas (10 casillas) — debajo de los datos */}
        <section className="card bg-base-100 shadow-sm border border-base-200 lg:col-span-2">
          <div className="card-body">
            <div className="flex items-center justify-between gap-2">
              <h3 className="card-title">Tarjeta de visitas</h3>
              <div className="text-sm opacity-70">Ciclo actual: {prog.filled}/10</div>
            </div>

            <div className="mb-3 text-sm">
              <span
                className={`badge mr-2 ${
                  prog.filled >= 5 ? "badge-success" : "badge-ghost"
                }`}
              >
                {prog.filled >= 5 ? "50% disponible" : `${5 - prog.filled} para 50%`}
              </span>
              <span
                className={`badge ${
                  prog.filled >= 10 ? "badge-success" : "badge-ghost"
                }`}
              >
                {prog.filled >= 10 ? "Gratis disponible" : `${10 - prog.filled} para gratis`}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-3 max-w-xl">
              {Array.from({ length: 10 }).map((_, i) => {
                const filled = i < prog.filled;
                return (
                  <div
                    key={i}
                    className={`h-16 rounded-2xl border grid place-items-center text-xl font-semibold ${
                      filled
                        ? "bg-brand-primary text-white border-brand-primary"
                        : "bg-base-200 border-base-300 text-base-content/40"
                    }`}
                  >
                    {filled ? "★" : "—"}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                className={`btn btn-primary ${busy ? "loading" : ""}`}
                disabled={!canAddVisit || busy}
                onClick={tryRegister}
              >
                {busy ? "" : "Añadir visita (hoy)"}
              </button>

              {prog.filled >= 5 && prog.filled < 10 && (
                <button className="btn btn-outline">
                  Emitir recompensa 50% (manual)
                </button>
              )}
              {prog.filled >= 10 && (
                <button className="btn btn-outline">
                  Emitir recompensa gratis (manual)
                </button>
              )}
              <span className="opacity-50 text-xs">
                * Las recompensas pueden integrarse con tu backend cuando quieras.
              </span>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
