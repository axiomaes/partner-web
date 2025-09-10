// partner-web/src/pages/CPanelAdminDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { api, listCpBusinesses, type CpBusiness } from "@/shared/api";
import { useSession } from "@/shared/auth";

function fmtYYYYMM(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function CPanelAdminDashboard() {
  useSession(); // el guard ProtectedCpanelRoute ya valida SUPERADMIN/token

  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [bizList, setBizList] = useState<CpBusiness[]>([]);
  const [bizId, setBizId] = useState<string>("");

  const [period, setPeriod] = useState<string>(fmtYYYYMM(new Date()));
  const [loadingBiz, setLoadingBiz] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingFinalize, setLoadingFinalize] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;

    // Health CP
    (async () => {
      try {
        const r = await api.get("/cp/health", { validateStatus: () => true });
        if (!mounted) return;
        setHealthOk(r.status >= 200 && r.status < 300);
      } catch {
        if (!mounted) return;
        setHealthOk(false);
      }
    })();

    // Businesses (descubrimiento con fallback)
    (async () => {
      setLoadingBiz(true);
      setErr(null);
      try {
        const items = await listCpBusinesses();
        if (!mounted) return;
        setBizList(items);
        if (items.length && !bizId) setBizId(String(items[0]?.id));
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "No se pudieron cargar los negocios.");
      } finally {
        if (mounted) setLoadingBiz(false);
      }
    })();

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canActions = useMemo(() => !!bizId && !!period, [bizId, period]);

  async function onPreview() {
    if (!canActions) return;
    setLoadingPreview(true);
    setErr(null);
    setPreviewData(null);
    try {
      const r = await api.get("/cp/billing/preview", {
        params: { businessId: bizId, period },
        validateStatus: () => true,
      });
      if (r.status >= 200 && r.status < 300) setPreviewData(r.data);
      else throw new Error(r.data?.message || `Preview falló (HTTP ${r.status})`);
    } catch (e: any) {
      setErr(e?.message || "No se pudo obtener el preview.");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function onFinalize() {
    if (!canActions) return;
    setLoadingFinalize(true);
    setErr(null);
    try {
      const r = await api.post("/cp/billing/finalize", { businessId: bizId, period }, { validateStatus: () => true });
      if (r.status >= 200 && r.status < 300) setPreviewData(r.data);
      else throw new Error(r.data?.message || `Finalize falló (HTTP ${r.status})`);
    } catch (e: any) {
      setErr(e?.message || "No se pudo finalizar el periodo.");
    } finally {
      setLoadingFinalize(false);
    }
  }

  const healthBadge =
    healthOk == null ? (
      <span className="badge badge-ghost">Health: …</span>
    ) : healthOk ? (
      <span className="badge badge-success">Health: OK</span>
    ) : (
      <span className="badge badge-error">Health: FAIL</span>
    );

  return (
    <div className="container-app">
      <div className="flex items-center justify-between py-2">
        <h1 className="text-2xl font-semibold">CPanel · Billing</h1>
        {healthBadge}
      </div>

      {err && (
        <div className="alert alert-warning my-3">
          <span>{err}</span>
        </div>
      )}

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Negocio */}
            <label className="form-control">
              <span className="label-text">Negocio</span>
              <select
                className="select select-bordered"
                disabled={loadingBiz || !bizList.length}
                value={bizId}
                onChange={(e) => setBizId(e.target.value)}
              >
                {!bizList.length && <option value="">(sin datos)</option>}
                {bizList.map((b) => (
                  <option key={String(b.id)} value={String(b.id)}>
                    {b.displayName || b.name || b.id}
                  </option>
                ))}
              </select>
            </label>

            {/* Periodo */}
            <label className="form-control">
              <span className="label-text">Periodo (YYYY-MM)</span>
              <input
                type="month"
                className="input input-bordered"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              />
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button className="btn btn-neutral" disabled={!canActions || loadingPreview} onClick={onPreview}>
              {loadingPreview ? "Cargando…" : "Preview"}
            </button>
            <button className="btn" disabled={!canActions || loadingFinalize} onClick={onFinalize}>
              {loadingFinalize ? "Finalizando…" : "Finalize"}
            </button>
          </div>
        </div>
      </div>

      {previewData && (
        <div className="card bg-base-100 shadow-sm mt-4">
          <div className="card-body">
            <h2 className="card-title">Resultado</h2>
            <pre className="text-xs overflow-x-auto">{JSON.stringify(previewData, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
