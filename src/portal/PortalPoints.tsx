// partner-web/src/portal/PortalPoints.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadPortalSession,
  clearPortalSession,
  getMyRewards,
  getMyVisits,
} from "@/shared/api";
import CustomerQR from "@/components/CustomerQR";

type Visit = { id: string; visitedAt: string; notes?: string | null };
type Reward = {
  id: string;
  status: "PENDING" | "REDEEMED" | "EXPIRED";
  note?: string | null;
  kind?: string | null;
};

export default function PortalPoints() {
  const nav = useNavigate();
  const session = loadPortalSession();

  const [visits, setVisits] = useState<Visit[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.token) {
      nav("/portal", { replace: true });
      return;
    }
    (async () => {
      try {
        const [v, r] = await Promise.all([getMyVisits(), getMyRewards()]);
        setVisits(v);
        setRewards(r);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalVisits = visits.length;
  const pendingRewards = useMemo(
    () => rewards.filter((r) => r.status === "PENDING").length,
    [rewards]
  );

  const logout = () => {
    clearPortalSession();
    nav("/portal", { replace: true });
  };

  if (!session?.token) return null;

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold">Mis puntos</h1>
          <button className="btn btn-ghost btn-sm" onClick={logout}>
            Salir
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* QR (componente reusable) */}
          <CustomerQR
            className="md:row-span-1"
            customerId={session.customerId!}
            businessId={session.businessId}
            title="Mi QR"
            helperText="Muestra este código al personal para acreditar tu visita."
            size={192}
          />

          {/* Resumen */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Resumen</h2>
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="loading loading-spinner" /> Cargando…
                </div>
              ) : (
                <div className="stats shadow-sm">
                  <div className="stat">
                    <div className="stat-title">Visitas</div>
                    <div className="stat-value text-primary">{totalVisits}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Recompensas pendientes</div>
                    <div className="stat-value">{pendingRewards}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Listas */}
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h3 className="card-title">Mis visitas</h3>
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="loading loading-spinner" /> Cargando…
                </div>
              ) : visits.length ? (
                <ul className="text-sm list-disc ml-5">
                  {visits.map((v) => (
                    <li key={v.id}>
                      {new Date(v.visitedAt).toLocaleString()}{" "}
                      {v.notes ? `— ${v.notes}` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm opacity-70">Aún no tienes visitas.</div>
              )}
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h3 className="card-title">Mis recompensas</h3>
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="loading loading-spinner" /> Cargando…
                </div>
              ) : rewards.length ? (
                <ul className="text-sm list-disc ml-5">
                  {rewards.map((r) => (
                    <li key={r.id}>
                      {r.status} — {r.note || r.kind || r.id}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm opacity-70">Aún no tienes recompensas.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
