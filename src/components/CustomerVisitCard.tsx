import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/shared/auth";
import { api, addVisit } from "@/shared/api";

type Progress = {
  count: number;
  target: number;
  toNextReward: number;
  pending?: boolean; // recompensa pendiente de canje (si el backend lo envía)
};

type Props = {
  customerId: string;
  onChanged?: (p: Progress) => void;
};

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function CustomerVisitCard({ customerId, onChanged }: Props) {
  const { role } = useSession();
  const canAdd = useMemo(
    () => ["BARBER", "ADMIN", "OWNER", "SUPERADMIN"].includes(String(role || "")),
    [role]
  );

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);

  async function fetchProgress() {
    setLoading(true);
    setMsg(null);
    try {
      const r = await api.get(`/customers/${encodeURIComponent(customerId)}/progress`, {
        validateStatus: () => true,
      });
      if (r.status >= 200 && r.status < 300) {
        const p = r.data as Progress;
        setProgress(p);
        onChanged?.(p);
      } else {
        throw new Error(r.data?.message || `HTTP ${r.status}`);
      }
    } catch (e: any) {
      setMsg("❌ " + (e?.response?.data?.message || e?.message || "No se pudo cargar el progreso."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (customerId) fetchProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  async function onAdd() {
    if (!canAdd || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      // addVisit ya existe en tu API helper
      const r = await addVisit(customerId, "Visita desde tarjeta");
      // algunos backends devuelven { progress, newReward, ... }
      const p: Progress | undefined = r?.progress;
      if (p) {
        setProgress(p);
        onChanged?.(p);
      } else {
        await fetchProgress();
      }
      setMsg("✅ Visita registrada.");
    } catch (e: any) {
      setMsg("❌ " + (e?.response?.data?.message || e?.message || "No se pudo registrar la visita."));
    } finally {
      setBusy(false);
    }
  }

  // Cálculo de casillas del ciclo
  const target = progress?.target ?? 10;
  const count = progress?.count ?? 0;
  const cycle = count % target;
  const filled = count > 0 && cycle === 0 ? target : cycle; // 0=>ciclo completo

  return (
    <section className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body">
        <div className="flex items-center justify-between gap-2">
          <h3 className="card-title">Tarjeta de visitas</h3>
          <div className="text-sm opacity-70">Ciclo actual: {filled}/{target}</div>
        </div>

        {progress?.target === 10 && (
          <div className="mb-3 text-sm">
            <span className={cls("badge mr-2", filled >= 5 ? "badge-success" : "badge-ghost")}>
              {filled >= 5 ? "50% disponible" : `${Math.max(0, 5 - filled)} para 50%`}
            </span>
            <span className={cls("badge", filled >= 10 ? "badge-success" : "badge-ghost")}>
              {filled >= 10 ? "Gratis disponible" : `${Math.max(0, 10 - filled)} para gratis`}
            </span>
          </div>
        )}

        {/* Matriz de casillas numeradas */}
        <div className="grid grid-cols-5 gap-3 max-w-xl">
          {Array.from({ length: target }).map((_, i) => {
            const idx = i + 1; // 1..target
            const isFilled = idx <= filled;
            const fullCycle = filled === target && count > 0;
            return (
              <div
                key={i}
                className={cls(
                  "h-16 rounded-2xl border grid place-items-center text-xl font-semibold select-none",
                  isFilled
                    ? fullCycle
                      ? "bg-orange-500 text-white border-orange-600"
                      : "bg-sky-500 text-white border-sky-600"
                    : "bg-base-200 border-base-300 text-base-content/40"
                )}
              >
                {idx}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            className={cls("btn btn-primary", busy && "loading")}
            onClick={onAdd}
            disabled={!canAdd || busy}
          >
            {busy ? "" : "Añadir visita (hoy)"}
          </button>

          {loading && <span className="loading loading-spinner loading-sm" />}

          {progress?.pending && (
            <span className="badge badge-warning">🎉 Recompensa pendiente</span>
          )}

          {msg && (
            <span className={cls("text-sm", msg.startsWith("❌") ? "text-warning" : "text-success")}>
              {msg}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
