import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/shared/auth";

type Visit = { id: string; visitedAt: string };
type Props = {
  customerId: string;
  threshold?: number;         // Nº de casillas (p.ej. 10)
  cols?: number;              // Nº de columnas para vista horizontal (p.ej. 5)
  bonusLabels?: string[];     // Extra (opcional) para casillas de promo, etc.
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
  bonusLabels = [],
  onChanged,
}: Props) {
  const s = useSession(); // { token, role, ... }
  const API = import.meta.env.VITE_API_BASE || "";
  const canEdit = ["ADMIN", "BARBER", "OWNER", "SUPERADMIN"].includes(s.role || "");

  const [loading, setLoading] = useState(false);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => Math.ceil(threshold / cols), [threshold, cols]);

  async function load() {
    if (!s.token) return;
    setLoading(true);
    setError(null);
    try {
      // Ajusta a tu backend real si lo tienes distinto:
      const url = `${API}/app/customers/${customerId}/visits?limit=${threshold}&order=desc`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${s.token}` } });
      if (!res.ok) throw new Error(`GET visits ${res.status}`);
      const data = await res.json();
      // admite formatos {rows: Visit[]} o [Visit...]
      const arr: Visit[] = Array.isArray(data) ? data : data.rows ?? [];
      // Orden más antiguo → más reciente para pintar en orden natural
      arr.sort((a, b) => new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime());
      setVisits(arr.slice(-threshold));
      onChanged?.(arr);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando visitas");
    } finally {
      setLoading(false);
    }
  }

  async function addVisit() {
    if (!canEdit || !s.token) return;
    setLoading(true);
    setError(null);
    try {
      const url = `${API}/app/customers/${customerId}/visits`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${s.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: "added from punch-card" }),
      });
      if (!res.ok) throw new Error(`POST visit ${res.status}`);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Error creando visita");
      setLoading(false);
    }
  }

  async function undoLast() {
    if (!canEdit || !s.token || visits.length === 0) return;
    const last = visits[visits.length - 1];
    setLoading(true);
    setError(null);
    try {
      const url = `${API}/app/customers/${customerId}/visits/${last.id}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${s.token}` },
      });
      if (!res.ok) throw new Error(`DELETE visit ${res.status}`);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Error eliminando visita");
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, s.token]);

  // Render de casillas
  const cells = Array.from({ length: threshold }, (_, i) => {
    const v = visits[i]; // i: 0..threshold-1
    const filled = !!v;
    return (
      <div
        key={i}
        className={`flex items-center justify-center rounded-xl border bg-white shadow-sm
                    ${filled ? "border-emerald-300 ring-1 ring-emerald-200" : "border-slate-200"}
                    relative overflow-hidden`}
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
          {/* Tarjeta horizontal */}
          <div className="flex-1">
            <div
              className="rounded-2xl border border-slate-300 bg-slate-50 overflow-hidden"
              // relación horizontal (más ancho que alto)
            >
              <div className="grid gap-2 p-3"
                   style={{
                     gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                   }}>
                {cells}
                {/* Bonus opcionales al final de la tarjeta */}
                {bonusLabels.map((label, idx) => (
                  <div key={`bonus-${idx}`}
                       className="flex items-center justify-center rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-xs font-medium">
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Estado / acciones */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-500">
                Visitas: <b>{visits.length}</b> / {threshold}
              </span>

              {canEdit && (
                <>
                  <button
                    type="button"
                    onClick={addVisit}
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

          {/* Franja lateral inspirada en la tarjeta (opcional) */}
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
