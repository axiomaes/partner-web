import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/shared/auth";
import { addVisit, deleteCustomerVisit, getCustomerVisits } from "@/shared/api";

type Visit = { id: string; visitedAt: string; notes?: string | null };
type Props = {
  customerId: string;
  threshold?: number;
  cols?: number;
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

export default function VisitPunchCard({
  customerId,
  threshold = 10,
  cols = 5,
  onChanged,
}: Props) {
  const s = useSession();
  const canEdit = ["ADMIN", "BARBER", "OWNER", "SUPERADMIN"].includes(s.role || "");

  const [loading, setLoading] = useState(false);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => Math.ceil(threshold / cols), [threshold, cols]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomerVisits(customerId);
      const arr: Visit[] = Array.isArray(data) ? data : data.rows ?? [];
      arr.sort((a, b) => new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime());
      setVisits(arr.slice(-threshold));
      onChanged?.(arr);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando visitas");
    } finally {
      setLoading(false);
    }
  }

  async function onAdd() {
    if (!canEdit) return;
    setLoading(true);
    setError(null);
    try {
      await addVisit(customerId, "added from punch-card");
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Error creando visita");
      setLoading(false);
    }
  }

  async function undoLast() {
    if (!canEdit || visits.length === 0) return;
    const last = visits[visits.length - 1];
    setLoading(true);
    setError(null);
    try {
      await deleteCustomerVisit(customerId, last.id);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Error eliminando visita");
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const cells = Array.from({ length: threshold }, (_, i) => {
    const v = visits[i];
    const filled = !!v;
    return (
      <div
        key={i}
        className={`flex items-center justify-center rounded-xl border bg-white shadow-sm relative overflow-hidden
                    ${filled ? "border-emerald-300 ring-1 ring-emerald-200" : "border-slate-200"}
                    ${!filled && canEdit ? "cursor-pointer hover:bg-slate-50" : ""}`}
        title={filled ? fmtDateISOtoDDMM(v.visitedAt) : canEdit ? "Añadir visita" : ""}
        onClick={() => { if (!filled && canEdit && !loading) onAdd(); }}
      >
        {filled ? (
          <span className="text-sm font-medium text-slate-700">{fmtDateISOtoDDMM(v.visitedAt)}</span>
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
              <div className="grid gap-2 p-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                {cells}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-500">
                Visitas: <b>{visits.length}</b> / {threshold}
              </span>

              {canEdit && (
                <>
                  <button
                    type="button"
                    onClick={onAdd}
                    disabled={loading || visits.length >= threshold}
                    className="btn btn-sm btn-primary"
                  >
                    + Añadir visita (hoy)
                  </button>
                  <button
                    type="button"
                    onClick={undoLast}
                    disabled={loading || visits.length === 0}
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
                Oferta canjeable <b>lun–jue</b><br />presentando esta tarjeta.
              </div>
              <div className="text-[11px] opacity-80">
                Síguenos en Instagram
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
