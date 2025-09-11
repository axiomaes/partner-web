// partner-web/src/pages/CustomerDetail.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import {
  getCustomerRewards,
  getCustomerVisits,
  addVisit,
  resendCustomerQr,
  deleteCustomer,
  getCustomer,
  type CustomerLite,
  api,
} from "@/shared/api";
import { useSession, isAdmin } from "@/shared/auth";

export type Visit = { id: string; visitedAt: string; notes?: string | null };
export type Reward = {
  id: string;
  issuedAt: string;
  redeemedAt?: string | null;
  note?: string | null;
  status: "PENDING" | "REDEEMED" | "EXPIRED";
  // ⭐ NUEVO: si el backend lo envía, mejor. Si no, lo inferimos por note.
  kind?: "GOOGLE_REVIEW_50" | "FREE_SERVICE_10" | string;
};

function fmt(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleString();
}
function fmtDDMM(iso?: string | null) {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
}

// ⭐ NUEVO: helpers para reconocer recompensas por su nota/kind
function isReview50Reward(r: Reward) {
  const k = (r.kind || "").toUpperCase();
  if (k === "GOOGLE_REVIEW_50") return true;
  const n = (r.note || "").toLowerCase();
  return n.includes("google") && (n.includes("50") || n.includes("descuento"));
}
function isFree10Reward(r: Reward) {
  const k = (r.kind || "").toUpperCase();
  if (k === "FREE_SERVICE_10") return true;
  const n = (r.note || "").toLowerCase();
  return n.includes("gratis") || n.includes("10 visitas") || n.includes("free");
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { role } = useSession();
  const admin = isAdmin(role);
  const canDelete = ["ADMIN", "OWNER", "SUPERADMIN"].includes(String(role || ""));
  const canRedeem = ["ADMIN", "OWNER", "SUPERADMIN"].includes(String(role || ""));
  const canEditPunch = ["ADMIN", "BARBER", "OWNER", "SUPERADMIN"].includes(String(role || ""));

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [customer, setCustomer] = useState<CustomerLite | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [addingVisit, setAddingVisit] = useState(false);
  const [sendingQr, setSendingQr] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [undoing, setUndoing] = useState(false);

  const headerTitle = useMemo(() => {
    const fallback = id?.slice(0, 8) ?? "";
    return `Cliente — ${customer?.name || fallback}`;
  }, [id, customer]);

  const CARD_SLOTS = 10;
  const CARD_COLS = 5;

  const orderedVisits = useMemo(
    () => [...visits].sort((a, b) => new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime()),
    [visits]
  );
  const recentForCard = useMemo(() => orderedVisits.slice(-CARD_SLOTS), [orderedVisits]);

  // ⭐ NUEVO: KPIs y reglas
  const totalVisits = orderedVisits.length;
  const review50AlreadyIssued = useMemo(
    () => rewards.some((r) => isReview50Reward(r)),
    [rewards]
  );
  const review50AlreadyRedeemed = useMemo(
    () => rewards.some((r) => isReview50Reward(r) && r.status === "REDEEMED"),
    [rewards]
  );
  const free10Pending = useMemo(() => {
    // cada múltiplo de 10 visitas -> 1 recompensa FREE_SERVICE_10
    if (totalVisits < 10) return false;
    const expectedCount = Math.floor(totalVisits / 10);
    const issuedCount = rewards.filter((r) => isFree10Reward(r)).length;
    return issuedCount < expectedCount;
  }, [totalVisits, rewards]);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    setErr("");

    (async () => {
      const [c, r, v] = await Promise.allSettled([
        getCustomer(id),
        getCustomerRewards(id),
        getCustomerVisits(id),
      ]);

      if (!alive) return;

      let anyRejected = false;

      if (c.status === "fulfilled") setCustomer(c.value as CustomerLite);
      else anyRejected = true;

      if (r.status === "fulfilled" && Array.isArray(r.value)) setRewards(r.value as Reward[]);
      else if (r.status === "rejected") anyRejected = true;

      if (v.status === "fulfilled" && Array.isArray(v.value)) setVisits(v.value as Visit[]);
      else if (v.status === "rejected") anyRejected = true;

      if (anyRejected) setErr("No se pudieron cargar los datos del cliente.");

      setLoading(false);
    })();

    return () => { alive = false; };
  }, [id]);

  async function reloadVisitsAndRewards() {
    if (!id) return;
    const [v, r] = await Promise.all([getCustomerVisits(id), getCustomerRewards(id)]);
    setVisits(Array.isArray(v) ? (v as Visit[]) : []);
    setRewards(Array.isArray(r) ? (r as Reward[]) : []);
  }

  async function onAddVisit() {
    if (!id) return;
    try {
      setAddingVisit(true);
      await addVisit(id, "Visita manual");
      await reloadVisitsAndRewards();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "No se pudo registrar la visita.";
      setErr(msg);
    } finally {
      setAddingVisit(false);
    }
  }

  async function onUndoLast() {
    if (!id || recentForCard.length === 0) return;
    const last = recentForCard[recentForCard.length - 1];
    try {
      setUndoing(true);
      await api.delete(`/customers/${id}/visits/${last.id}`);
      await reloadVisitsAndRewards();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "No se pudo deshacer la última visita.";
      setErr(msg);
    } finally {
      setUndoing(false);
    }
  }

  async function onResendQr() {
    if (!id) return;
    try {
      setSendingQr(true);
      await resendCustomerQr(id);
      alert("QR reenviado (si el proveedor está configurado).");
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "No se pudo reenviar el QR.";
      setErr(msg);
    } finally {
      setSendingQr(false);
    }
  }

  async function onRedeem(rewardId: string) {
    if (!id) return;
    if (!canRedeem) {
      setErr("No tienes permiso para canjear recompensas.");
      return;
    }
    const ok = confirm("¿Canjear esta recompensa ahora?");
    if (!ok) return;

    try {
      setRedeemingId(rewardId);
      await api.post(`/customers/${id}/rewards/redeem`, { rewardId });
      await reloadVisitsAndRewards();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "No se pudo canjear la recompensa.";
      setErr(msg);
    } finally {
      setRedeemingId(null);
    }
  }

  // ⭐ NUEVO: emitir recompensas desde UI si tu API ya lo soporta
  async function issueReview50() {
    if (!id) return;
    try {
      await api.post(`/customers/${id}/rewards/issue`, {
        kind: "GOOGLE_REVIEW_50",
        note: "50% descuento por reseña en Google",
      });
      await reloadVisitsAndRewards();
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "No se pudo emitir la recompensa de reseña.");
    }
  }
  async function issueFree10() {
    if (!id) return;
    try {
      await api.post(`/customers/${id}/rewards/issue`, {
        kind: "FREE_SERVICE_10",
        note: "Servicio gratis por 10 visitas",
      });
      await reloadVisitsAndRewards();
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "No se pudo emitir la recompensa de 10 visitas.");
    }
  }

  async function onDelete() {
    if (!id || !canDelete) return;
    const ok = confirm(`¿Eliminar definitivamente ${customer?.name || "este cliente"}?`);
    if (!ok) return;
    try {
      setDeleting(true);
      await deleteCustomer(id);
      nav("/app/customers", { replace: true });
    } catch (e: any) {
      const status = e?.response?.status;
      const apiMsg = e?.response?.data?.message;
      const msg =
        status === 401 || status === 403
          ? apiMsg || "No tienes permiso para eliminar (usa un usuario ADMIN/OWNER/SUPERADMIN)."
          : apiMsg || e?.message || "No se pudo eliminar el cliente.";
      setErr(msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppLayout title={headerTitle} subtitle="Detalle del cliente">
      {err && (
        <div className="alert alert-warning mb-4">
          <span>{err}</span>
        </div>
      )}

      {/* ⭐ NUEVO: Banners de reglas */}
      {!review50AlreadyIssued && (
        <div className="alert alert-info mb-3">
          <div>
            <b>Promo reseña en Google:</b> si el cliente deja una reseña, obtiene <b>50% de descuento</b> (una sola vez).
          </div>
          {canRedeem && (
            <button className="btn btn-sm btn-primary mt-2" onClick={issueReview50}>
              Emitir recompensa 50% (manual)
            </button>
          )}
        </div>
      )}
      {free10Pending && (
        <div className="alert alert-success mb-3">
          <div>
            ¡Hito alcanzado! <b>{totalVisits}</b> visitas ⇒ falta emitir <b>servicio gratis</b> por las 10 visitas.
          </div>
          {canRedeem && (
            <button className="btn btn-sm btn-primary mt-2" onClick={issueFree10}>
              Emitir “Servicio gratis”
            </button>
          )}
        </div>
      )}

      {/* Resumen corto */}
      <div className="mb-4 text-sm opacity-80">
        Total visitas: <b>{totalVisits}</b> ·
        {" "}
        Reseña 50%: {review50AlreadyRedeemed ? <b>canjeada</b> : review50AlreadyIssued ? "pendiente" : "no emitida"}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link to="/app/customers" className="btn btn-ghost btn-sm">← Volver al listado</Link>
        <button
          onClick={onAddVisit}
          className={`btn btn-primary btn-sm ${addingVisit ? "loading" : ""}`}
          disabled={addingVisit || !id || !canEditPunch}
          title={!canEditPunch ? "Tu rol no puede registrar visitas" : undefined}
        >
          {addingVisit ? "" : "Añadir visita"}
        </button>
        <button
          onClick={onResendQr}
          className={`btn btn-outline btn-sm ${sendingQr ? "loading" : ""}`}
          disabled={sendingQr || !id}
        >
          {sendingQr ? "" : "Reenviar QR"}
        </button>
        {canDelete && (
          <button
            onClick={onDelete}
            className={`btn btn-error btn-sm ${deleting ? "loading" : ""}`}
            disabled={deleting}
          >
            {deleting ? "" : "Eliminar cliente"}
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-4 flex items-center gap-2">
          <span className="loading loading-spinner" />
          Cargando…
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Tarjeta de visitas */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title">Tarjeta de visitas</h3>
              <div className="rounded-2xl border border-base-300 bg-base-200 p-3">
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${CARD_COLS}, minmax(0,1fr))` }}>
                  {Array.from({ length: CARD_SLOTS }).map((_, i) => {
                    const v = recentForCard[i];
                    const filled = !!v;
                    return (
                      <div
                        key={i}
                        className={[
                          "h-16 sm:h-20 rounded-xl border bg-base-100 flex items-center justify-center",
                          filled ? "border-emerald-300 ring-1 ring-emerald-200" : "border-base-300",
                        ].join(" ")}
                      >
                        {filled ? (
                          <span className="text-sm font-medium text-base-content">
                            {fmtDDMM(v.visitedAt)}
                          </span>
                        ) : (
                          <span className="text-xs text-base-content/50">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-sm opacity-70">
                  Visitas: <b>{orderedVisits.length}</b> (mostrando últimas {CARD_SLOTS})
                </span>
                {canEditPunch && (
                  <>
                    <button onClick={onAddVisit} className={`btn btn-sm btn-primary ${addingVisit ? "loading" : ""}`} disabled={addingVisit}>
                      {addingVisit ? "" : "+ Añadir visita (hoy)"}
                    </button>
                    <button
                      onClick={onUndoLast}
                      className={`btn btn-sm btn-outline ${undoing ? "loading" : ""}`}
                      disabled={undoing || recentForCard.length === 0}
                      title={recentForCard.length === 0 ? "Sin visitas para deshacer" : undefined}
                    >
                      {undoing ? "" : "↶ Deshacer última"}
                    </button>
                  </>
                )}
                {!canEditPunch && (
                  <span className="text-xs opacity-60">Solo ADMIN / BARBER / OWNER / SUPERADMIN pueden editar visitas.</span>
                )}
              </div>
            </div>
          </div>

          {/* Visitas tabla */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title">Visitas</h3>
              {visits.length === 0 ? (
                <div className="text-sm opacity-60">Sin visitas.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-compact">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visits.map((v) => (
                        <tr key={v.id}>
                          <td>{fmt(v.visitedAt)}</td>
                          <td>{v.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Recompensas */}
          <div className="card bg-base-100 shadow md:col-span-2">
            <div className="card-body">
              <h3 className="card-title">Recompensas</h3>
              {rewards.length === 0 ? (
                <div className="text-sm opacity-60">Sin recompensas.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-compact">
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th>Emitida</th>
                        <th>Canjeada</th>
                        <th>Nota</th>
                        <th className="w-1">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rewards.map((r) => (
                        <tr key={r.id}>
                          <td className="text-xs">
                            {isReview50Reward(r) ? "Reseña 50%" : isFree10Reward(r) ? "Gratis x10" : (r.kind || "—")}
                          </td>
                          <td>
                            {r.status === "REDEEMED" ? (
                              <span className="badge badge-success gap-1">✓ Canjeada</span>
                            ) : r.status === "PENDING" ? (
                              <span className="badge badge-outline">PENDIENTE</span>
                            ) : (
                              <span className="badge">EXPIRADA</span>
                            )}
                          </td>
                          <td>{fmt(r.issuedAt)}</td>
                          <td>{fmt(r.redeemedAt)}</td>
                          <td style={{ whiteSpace: "pre-wrap" }}>{r.note || "—"}</td>
                          <td className="text-right">
                            {r.status === "PENDING" && canRedeem ? (
                              <button
                                onClick={() => onRedeem(r.id)}
                                className={`btn btn-xs btn-primary ${redeemingId === r.id ? "loading" : ""}`}
                                disabled={redeemingId === r.id}
                                title="Canjear recompensa"
                              >
                                {redeemingId === r.id ? "" : "Canjear"}
                              </button>
                            ) : (
                              <span className="text-xs opacity-60">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!canRedeem && (
                    <p className="text-xs opacity-60 mt-2">
                      Solo ADMIN / OWNER / SUPERADMIN pueden canjear recompensas.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!admin && (
        <p className="text-xs opacity-60 mt-6">Algunas columnas pueden estar ocultas según tu rol.</p>
      )}
    </AppLayout>
  );
}
