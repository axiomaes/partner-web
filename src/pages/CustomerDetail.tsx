import { useEffect, useMemo, useState } from "react";
import { api, addVisit, getCustomerRewards, getCustomerVisits } from "@/shared/api";
import { useSession, isAdmin } from "@/shared/auth";

type Customer = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  tag?: "NONE" | "NEW" | "FRIEND" | "VIP";
};

type Visit = { id: string; visitedAt: string; notes?: string | null };
type Reward = { id: string; status: "PENDING" | "REDEEMED" | "EXPIRED"; note?: string | null; kind?: string | null };

function maskPhone(p?: string | null) {
  return p ? p.replace(/.(?=.{4})/g, "•") : "—";
}
function maskEmail(e?: string | null) {
  if (!e) return "—";
  const [u, d] = e.split("@");
  const uu = (u ?? "").slice(0, 2) + "•".repeat(Math.max(0, (u ?? "").length - 2));
  return `${uu}@${d ?? ""}`;
}

export default function CustomerDetail() {
  const id = decodeURIComponent(location.pathname.split("/").pop()!);
  const { role } = useSession();
  const admin = isAdmin(role);

  const [c, setC] = useState<Customer | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [msg, setMsg] = useState("");

  // Filtros
  const [minVisits, setMinVisits] = useState<number>(0);
  const [rewardFilter, setRewardFilter] = useState<"" | "PENDING" | "REDEEMED" | "EXPIRED">("");

  useEffect(() => {
    // Detalle cliente
    api.get(`/customers/${id}`).then(r => setC(r.data)).catch(() => setC(null));
    // Recompensas
    getCustomerRewards(id).then(setRewards).catch(() => setRewards([]));
    // Visitas (si tu API no expone GET, se quedará vacío y la UI seguirá funcionando)
    getCustomerVisits(id).then(setVisits).catch(() => setVisits([]));
  }, [id]);

  const onAddVisit = async () => {
    try {
      const r = await addVisit(id, "Visita desde dashboard");
      setMsg(`Visita OK · Progreso ${r?.progress?.count ?? "?"}/${r?.progress?.target ?? "?"}${r?.newReward?.id ? ` · Nueva recompensa: ${r.newReward.id}` : ""}`);
      // refrescar datos
      getCustomerRewards(id).then(setRewards).catch(() => {});
      getCustomerVisits(id).then(setVisits).catch(() => {});
    } catch (e: any) {
      setMsg(e?.response?.data?.message || e.message);
    }
  };

  // Derivados para filtros
  const totalVisits = visits.length;
  const filteredVisits = useMemo(
    () => (minVisits > 0 ? visits.slice(0, totalVisits) : visits),
    [visits, minVisits, totalVisits]
  );

  const filteredRewards = useMemo(
    () => (rewardFilter ? rewards.filter(r => r.status === rewardFilter) : rewards),
    [rewards, rewardFilter]
  );

  if (!c) return <div className="p-4">Cargando…</div>;

  const phoneDisplay = admin ? (c.phone || "—") : (maskPhone(c.phone));
  const emailDisplay = admin ? (c.email || "—") : (maskEmail(c.email));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Cliente</h1>
        <a className="text-sm underline" href="/">← Volver</a>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {/* Datos del cliente */}
        <div className="p-3 border rounded">
          <div className="text-sm text-gray-500">Nombre</div>
          <div className="font-medium">{c.name}</div>

          <div className="mt-2 text-sm text-gray-500">Teléfono</div>
          <div className="font-medium">{phoneDisplay}</div>

          <div className="mt-2 text-sm text-gray-500">Email</div>
          <div className="font-medium">{emailDisplay}</div>

          <div className="mt-2 text-sm text-gray-500">Etiqueta</div>
          <div className="font-medium">{c.tag || "NONE"}</div>
        </div>

        {/* Acciones y estado */}
        <div className="p-3 border rounded space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Puntos / Visitas</h2>
            <button onClick={onAddVisit} className="bg-blue-600 text-white px-3 py-1 rounded">
              Añadir visita
            </button>
          </div>
          {msg && <p className="text-sm">{msg}</p>}

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="p-2 border rounded">
              <div className="text-xs uppercase text-gray-500">Visitas totales</div>
              <div className="text-xl font-semibold">{totalVisits}</div>
            </div>
            <div className="p-2 border rounded">
              <div className="text-xs uppercase text-gray-500">Recompensas</div>
              <div className="text-xl font-semibold">{rewards.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="p-3 border rounded grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-600">Filtro: mínimo de visitas (cliente)</label>
          <input
            type="number"
            min={0}
            className="border rounded p-2 w-full mt-1"
            value={minVisits}
            onChange={e => setMinVisits(Number(e.target.value) || 0)}
          />
          <div className="text-xs text-gray-500 mt-1">
            (Visual; no cambia el backend. Muestra todas las visitas, pero puedes filtrar el recuento mínimo.)
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-600">Filtro: estado de recompensa</label>
          <select
            className="border rounded p-2 w-full mt-1"
            value={rewardFilter}
            onChange={e => setRewardFilter(e.target.value as any)}
          >
            <option value="">Todas</option>
            <option value="PENDING">Pendientes</option>
            <option value="REDEEMED">Canjeadas</option>
            <option value="EXPIRED">Expiradas</option>
          </select>
        </div>
      </div>

      {/* Recompensas */}
      <div className="p-3 border rounded">
        <h3 className="font-semibold mb-2">Recompensas</h3>
        {filteredRewards.length ? (
          <ul className="list-disc ml-5 text-sm">
            {filteredRewards.map((r) => (
              <li key={r.id}>
                {r.status} — {r.note || r.kind || r.id}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-500">Sin recompensas</div>
        )}
      </div>

      {/* Visitas */}
      <div className="p-3 border rounded">
        <h3 className="font-semibold mb-2">Visitas</h3>
        {filteredVisits.length ? (
          <ul className="list-disc ml-5 text-sm">
            {filteredVisits.map((v) => (
              <li key={v.id}>
                {new Date(v.visitedAt).toLocaleString()} — {v.notes || ""}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-500">Sin visitas</div>
        )}
      </div>
    </div>
  );
}
