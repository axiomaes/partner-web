import { useEffect, useState } from "react";
import { customerMe, customerRewards, customerVisits, loadCustomerToken, clearCustomerToken } from "./customerApi";
import { useNavigate } from "react-router-dom";

export default function PortalPoints() {
  const nav = useNavigate();
  const [me, setMe] = useState<{id:string;name:string;phone?:string;email?:string} | null>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[] | null>(null);

  useEffect(() => {
    if (!loadCustomerToken()) { nav("/portal"); return; }
    (async () => {
      const m = await customerMe();
      setMe(m);
      try { setRewards(await customerRewards(m.id)); } catch { setRewards([]); }
      try { setVisits(await customerVisits(m.id)); } catch { setVisits(null); }
    })().catch(()=>{});
  }, [nav]);

  const logout = () => {
    clearCustomerToken();
    nav("/portal");
  };

  if (!me) return <div>Cargando…</div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Hola, {me.name}</h1>
        <button className="text-sm underline" onClick={logout}>Salir</button>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        <div className="p-3 border rounded">
          <div className="text-sm text-gray-500">Tus datos</div>
          <div className="mt-1 text-sm">Móvil: {me.phone || "—"}</div>
          <div className="text-sm">Email: {me.email || "—"}</div>
        </div>

        <div className="p-3 border rounded">
          <div className="text-sm text-gray-500">Recompensas</div>
          <ul className="list-disc ml-5 text-sm mt-1">
            {rewards.length ? rewards.map(r => (
              <li key={r.id}>{r.status} — {r.note || r.kind || r.id}</li>
            )) : <li>Sin recompensas</li>}
          </ul>
        </div>
      </div>

      {visits && (
        <div className="p-3 border rounded mt-3">
          <div className="text-sm text-gray-500">Últimas visitas</div>
          <ul className="list-disc ml-5 text-sm mt-1">
            {visits.slice(0,10).map(v => (
              <li key={v.id}>{new Date(v.visitedAt).toLocaleString()} — {v.notes || ""}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
