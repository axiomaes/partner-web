// partner-web/src/pages/CPanelAdminDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/shared/api";
import { useSession } from "@/shared/auth";

type Biz = {
  id: string;
  name: string;
};

type BillingKind = "LEASE" | "MSG_MARKETING" | "MSG_UTILITY";
type BillingStatus = "DRAFT" | "FINALIZED";

type BillingItem = {
  id?: string;
  businessId: string;
  period: string;
  kind: BillingKind;
  status: BillingStatus;
  quantity: number;
  unitAmountCents: number;
  totalAmountCents: number;
  meta?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

type PreviewResp = {
  ok: true;
  business: { id: string; name: string };
  period: string;
  range: { from: string; to: string };
  items: BillingItem[];
  subtotalCents: number;
};

type FeedResp = {
  ok: true;
  period: string;
  items: BillingItem[];
  totalFinalized: number;
};

function fmtMoneyCents(n: number) {
  const v = (n ?? 0) / 100;
  return v.toLocaleString(undefined, { style: "currency", currency: "EUR" });
}

function thisMonthUTC(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  return `${y}-${m < 10 ? "0" + m : m}`;
}

export default function CPanelAdminDashboard() {
  const nav = useNavigate();
  const { role } = useSession();

  // Seguridad extra (el ProtectedRoute ya lo filtra)
  useEffect(() => {
    if (role !== "SUPERADMIN") {
      nav("/unauthorized", { replace: true });
    }
  }, [role, nav]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [okMsg, setOkMsg] = useState<string>("");

  const [health, setHealth] = useState<string>("checking…");

  const [bizList, setBizList] = useState<Biz[]>([]);
  const [businessId, setBusinessId] = useState<string>("");
  const [period, setPeriod] = useState<string>(thisMonthUTC());

  const [preview, setPreview] = useState<PreviewResp | null>(null);
  const [feed, setFeed] = useState<FeedResp | null>(null);

  // Carga inicial: health + businesses
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const h = await api.get("/cp/health");
        if (!alive) return;
        setHealth(h?.data?.ok ? "OK" : "NO OK");
      } catch {
        if (alive) setHealth("DOWN");
      }

      try {
        // Listado de negocios CPANEL
        // Endpoint esperado del backend: GET /cp/admin/businesses  → { ok, rows: Biz[] }
        const resp = await api.get("/cp/admin/businesses");
        const rows: Biz[] = resp?.data?.rows ?? [];
        if (!alive) return;
        setBizList(rows);
        if (rows.length && !businessId) setBusinessId(rows[0].id);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.response?.data?.message || "No se pudo cargar el listado de negocios.");
      }
    })();
    return () => {
      alive = false;
    };
  }, []); // solo una vez

  const selectedBiz = useMemo(
    () => bizList.find((b) => b.id === businessId) || null,
    [bizList, businessId]
  );

  async function doPreview() {
    if (!businessId || !period) return;
    setErr("");
    setOkMsg("");
    setLoading(true);
    setFeed(null);
    try {
      const r = await api.get<PreviewResp>("/cp/billing/preview", {
        params: { businessId, period },
      });
      setPreview(r.data);
    } catch (e: any) {
      setPreview(null);
      setErr(e?.response?.data?.message || e?.message || "Error en preview.");
    } finally {
      setLoading(false);
    }
  }

  async function doFinalize() {
    if (!businessId || !period) return;
    setErr("");
    setOkMsg("");
    setLoading(true);
    try {
      await api.post("/cp/billing/finalize", { businessId, period });
      const r = await api.get<FeedResp>("/cp/billing/feed", {
        params: { businessId, period },
      });
      setFeed(r.data);
      setOkMsg("Periodo finalizado correctamente.");
    } catch (e: any) {
      setFeed(null);
      setErr(e?.response?.data?.message || e?.message || "Error al finalizar.");
    } finally {
      setLoading(false);
    }
  }

  function onChangeBiz(e: React.ChangeEvent<HTMLSelectElement>) {
    setBusinessId(e.target.value);
  }

  function onChangePeriod(e: React.ChangeEvent<HTMLInputElement>) {
    // Input type="month" devuelve YYYY-MM
    setPeriod(e.target.value);
  }

  const subtotalPreview = useMemo(
    () => (preview?.items ?? []).reduce((s, it) => s + (it.totalAmountCents ?? 0), 0),
    [preview]
  );

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">CPanel · Billing</h1>
        <span
          className={`badge ${health === "OK" ? "badge-success" : "badge-error"}`}
          title="Estado /cp/health"
        >
          Health: {health}
        </span>
      </div>

      {err && (
        <div className="alert alert-warning">
          <span>{err}</span>
        </div>
      )}
      {okMsg && (
        <div className="alert alert-success">
          <span>{okMsg}</span>
        </div>
      )}

      {/* Filtros */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body grid sm:grid-cols-3 gap-3">
          <div>
            <label className="label">
              <span className="label-text">Negocio</span>
            </label>
            <select
              value={businessId}
              onChange={onChangeBiz}
              className="select select-bordered w-full"
            >
              {bizList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} · {b.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">
              <span className="label-text">Periodo (YYYY-MM)</span>
            </label>
            <input
              type="month"
              value={period}
              onChange={onChangePeriod}
              className="input input-bordered w-full"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              className={`btn btn-primary ${loading ? "loading" : ""}`}
              onClick={doPreview}
              disabled={loading || !businessId || !period}
            >
              {loading ? "" : "Preview"}
            </button>
            <button
              className={`btn btn-outline ${loading ? "loading" : ""}`}
              onClick={doFinalize}
              disabled={loading || !businessId || !period}
              title="Persiste y marca como FINALIZED"
            >
              {loading ? "" : "Finalize"}
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <h2 className="card-title">Preview — {selectedBiz?.name}</h2>
              <div className="text-sm opacity-70">Periodo: {preview.period}</div>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-compact">
                <thead>
                  <tr>
                    <th>Kind</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Unit</th>
                    <th className="text-right">Total</th>
                    <th>Meta</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.items.map((it, idx) => (
                    <tr key={idx}>
                      <td>{it.kind}</td>
                      <td className="text-right">{it.quantity}</td>
                      <td className="text-right">{fmtMoneyCents(it.unitAmountCents)}</td>
                      <td className="text-right font-medium">
                        {fmtMoneyCents(it.totalAmountCents)}
                      </td>
                      <td className="text-xs opacity-70">
                        {it.meta ? JSON.stringify(it.meta) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan={3} className="text-right">
                      Subtotal
                    </th>
                    <th className="text-right">{fmtMoneyCents(subtotalPreview)}</th>
                    <th />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Feed (tras finalize) */}
      {feed && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <h2 className="card-title">Finalizado — {selectedBiz?.name}</h2>
              <div className="text-sm opacity-70">Periodo: {feed.period}</div>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-compact">
                <thead>
                  <tr>
                    <th>Kind</th>
                    <th>Status</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Unit</th>
                    <th className="text-right">Total</th>
                    <th>Meta</th>
                  </tr>
                </thead>
                <tbody>
                  {feed.items.map((it) => (
                    <tr key={`${it.kind}-${it.period}`}>
                      <td>{it.kind}</td>
                      <td>
                        <span
                          className={`badge ${
                            it.status === "FINALIZED" ? "badge-success" : "badge-ghost"
                          }`}
                        >
                          {it.status}
                        </span>
                      </td>
                      <td className="text-right">{it.quantity}</td>
                      <td className="text-right">{fmtMoneyCents(it.unitAmountCents)}</td>
                      <td className="text-right font-medium">
                        {fmtMoneyCents(it.totalAmountCents)}
                      </td>
                      <td className="text-xs opacity-70">
                        {it.meta ? JSON.stringify(it.meta) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan={4} className="text-right">
                      Total FINALIZED
                    </th>
                    <th className="text-right">{fmtMoneyCents(feed.totalFinalized)}</th>
                    <th />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
