// src/components/VisitPunchCard.tsx
import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/shared/auth";
import { api, addVisit as addVisitApi } from "@/shared/api";

type Visit = { id: string; visitedAt: string };
type Props = {
  customerId: string;
  threshold?: number;
  cols?: number;
  bonusLabels?: string[];
  totalCount?: number;
  onChanged?: (visits: Visit[]) => void;
};

function fmtDateISOtoDDMM(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}
function isDuplicateVisitError(e: any): boolean {
  const msg = e?.response?.data?.message || e?.message || "";
  return e?.response?.status === 409 || /same\s*day|mismo\s*d[ií]a|already.*today/i.test(msg);
}
function cycleProgress(total: number, threshold: number) {
  const t = Math.max(0, Number(total || 0));
  const mod = t % threshold;
  const filled = mod === 0 && t > 0 ? threshold : mod;
  return {
    filled,
    remainingTo5: Math.max(0, 5 - filled),
    remainingToEnd: Math.max(0, threshold - filled),
  };
}

export default function VisitPunchCard({
  customerId,
  threshold = 10,
  cols = 5,
  bonusLabels = [],
  totalCount,
  onChanged,
}: Props) {
  const s = useSession();
  const canEdit = ["ADMIN", "BARBER", "OWNER", "SUPERADMIN"].includes(s.role || "");
  const [loading, setLoading] = useState(false);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => Math.ceil(threshold / cols), [threshold, cols]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/customers/${encodeURIComponent(customerId)}/visits`, {
        params: { limit: threshold, order: "desc" },
      });
      const data = res.data;
      const arr: Visit[] = Array.isArray(data) ? data : data.rows ?? [];
      arr.sort((a, b) => new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime());
      const lastN = arr.slice(-threshold);
      setVisits(lastN);
      onChanged?.(lastN);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Error cargando visitas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  async function addVisit() {
    if (!canEdit) return;
    setError(null);
    setBusy(true);
    try {
      await addVisitApi(customerId); // ✅ solo 1 arg
      await load();
    } catch (e: any) {
      if (isDuplicateVisitError(e)) {
        setError("Ya se registró una visita hoy (override no disponible en el backend actual).");
      } else {
        setError(e?.response?.data?.message ?? e?.message ?? "No se pudo registrar la visita.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function undoLast() {
    if (!canEdit || visits.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      const last = visits[visits.length - 1];
      await api.delete(
        `/customers/${encodeURIComponent(customerId)}/visits/${encodeURIComponent(last.id)}`
      );
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "No se pudo deshacer.");
    } finally {
      setBusy(false);
    }
  }

  const filledForCycle =
    totalCount != null ? cycleProgress(totalCount, threshold).filled : visits.length;
  const { remainingTo5, remainingToEnd } = cycleProgress(totalCount ?? visits.length, threshold);

  const cells = Array.from({ length: threshold }, (_, i) => {
    const filled = i < filledForCycle;
    const v = visits[i];
    return (
      <div
        key={i}
        className={`flex items-center justify-center rounded-xl border bg-white shadow-sm
          ${filled ? "border-emerald-300 ring-1 ring-emerald-200" : "border-slate-200"}
          relative overflow-hidden h-16`}
      >
        {filled && v ? (
          <span className="text-sm font-medium text-slate-700">
            {fmtDateISOtoDDMM(v.visitedAt)}
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </div>
    );
  });

  return (
    <section className="w-full">
      <div className="bg-white border border-slate-200 rounded-2xl shadow p-4 md:p-5">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="rounded-2xl border border-slate-300 bg-slate-50 overflow-hidden">
              <div
                className="grid gap-2 p-3"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
              >
                {cells}
                {bonusLabels.map((label, idx) => (
                  <div
                    key={`bonus-${idx}`}
                    className="flex items-center justify-center rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-xs font-medium h-16"
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-500">
                Progreso: <b>{filledForCycle}</b> / {threshold}
              </span>
              <span className={`badge ${filledForCycle >= 5 ? "badge-success" : "badge-ghost"}`}>
                {filledForCycle >= 5 ? "50% disponible" : `${remainingTo5} para 50%`}
              </span>
              <span
                className={`badge ${filledForCycle >= threshold ? "badge-success" : "badge-ghost"}`}
              >
                {filledForCycle >= threshold ? "Gratis disponible" : `${remainingToEnd} para gratis`}
              </span>

              {canEdit && (
                <>
                  <button
                    type="button"
                    onClick={addVisit}
                    disabled={busy}
                    className={`btn btn-sm btn-primary ${busy ? "loading" : ""}`}
                  >
                    {busy ? "" : "+ Añadir visita (hoy)"}
                  </button>
                  <button
                    type="button"
                    onClick={undoLast}
                    disabled={busy || visits.length === 0}
                    className="btn btn-sm btn-outline"
                  >
                    ↶ Deshacer última
                  </button>
                </>
              )}

              {loading && <span className="loading loading-spinner loading-xs" />}
              {error && <span className="text-xs text-red-600 ml-2">{error}</span>}
            </div>
          </div>

          <div className="hidden lg:flex w-36 shrink-0">
            <div className="bg-slate-900 text-white rounded-xl p-3 h-full w-full flex flex-col justify-between">
              <div className="text-[11px] leading-tight opacity-90">
                Oferta canjeable <b>lun–jue</b>
                <br />
                presentando esta tarjeta.
              </div>
              <div className="text-[11px] opacity-80">Síguenos en Instagram</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
