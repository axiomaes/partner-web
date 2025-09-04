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
} from "@/shared/api";
import { useSession, isAdmin } from "@/shared/auth";

export type Visit = { id: string; visitedAt: string; notes?: string | null };
export type Reward = {
  id: string;
  issuedAt: string;
  redeemedAt?: string | null;
  note?: string | null;
  status: "PENDING" | "REDEEMED" | "EXPIRED";
};

function fmt(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleString();
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { role } = useSession();
  const admin = isAdmin(role);
  const canDelete = ["ADMIN", "OWNER", "SUPERADMIN"].includes(String(role || ""));

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [customer, setCustomer] = useState<CustomerLite | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [addingVisit, setAddingVisit] = useState(false);
  const [sendingQr, setSendingQr] = useState(false);

  const headerTitle = useMemo(() => {
    const fallback = id?.slice(0, 8) ?? "";
    return `Cliente — ${customer?.name || fallback}`;
  }, [id, customer]);

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

    return () => {
      alive = false;
    };
  }, [id]);

  async function onAddVisit() {
    if (!id) return;
    try {
      setAddingVisit(true);
      await addVisit(id, "Visita manual");
      const v = await getCustomerVisits(id);
      setVisits(Array.isArray(v) ? (v as Visit[]) : []);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "No se pudo registrar la visita.";
      setErr(msg);
    } finally {
      setAddingVisit(false);
    }
  }

  async function onResendQr() {
    if (!id) return;
    try {
      setSendingQr(true);
      await resendCustomerQr(id);
      alert("QR reenviado (si el proveedor está configurado).");
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "No se pudo reenviar el QR.";
      setErr(msg);
    } finally {
      setSendingQr(false);
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

      <div className="mb-4 flex flex-wrap gap-2">
        <Link to="/app/customers" className="btn btn-ghost btn-sm">
          ← Volver al listado
        </Link>
        <button
          onClick={onAddVisit}
          className={`btn btn-primary btn-sm ${addingVisit ? "loading" : ""}`}
          disabled={addingVisit || !id}
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
          {/* Visitas */}
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
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title">Recompensas</h3>
              {rewards.length === 0 ? (
                <div className="text-sm opacity-60">Sin recompensas.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-compact">
                    <thead>
                      <tr>
                        <th>Estado</th>
                        <th>Emitida</th>
                        <th>Canjeada</th>
                        <th>Nota</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rewards.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <span className="badge badge-outline">{r.status}</span>
                          </td>
                          <td>{fmt(r.issuedAt)}</td>
                          <td>{fmt(r.redeemedAt)}</td>
                          <td>{r.note || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!admin && (
        <p className="text-xs opacity-60 mt-6">
          Algunas columnas pueden estar ocultas según tu rol.
        </p>
      )}
    </AppLayout>
  );
}
