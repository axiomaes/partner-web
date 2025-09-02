import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import { api, addVisitByPhone, resendCustomerQr } from "@/shared/api";
import { useSession, isAdmin } from "@/shared/auth";

type Customer = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
};

export default function AdminPanel() {
  const nav = useNavigate();
  const { role } = useSession();
  const admin = isAdmin(role);

  // Guard “blando”: si no es admin, lo mando a inicio
  useEffect(() => {
    if (!admin) nav("/app", { replace: true });
  }, [admin, nav]);

  // ----- Estado: quick points -----
  const [qpPhone, setQpPhone] = useState("+34");
  const [qpNotes, setQpNotes] = useState("Puntos manuales (admin)");
  const [qpMsg, setQpMsg] = useState("");

  const onQuickPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    setQpMsg("");
    try {
      const r = await addVisitByPhone(qpPhone.trim(), qpNotes.trim());
      const t = `Visita registrada. Progreso ${r?.progress?.count ?? "?"}/${r?.progress?.target ?? "?"}${
        r?.newReward?.id ? ` · Nueva recompensa ${r.newReward.id}` : ""
      }`;
      setQpMsg(t);
    } catch (err: any) {
      setQpMsg(err?.response?.data?.message || err?.message || "No se pudo registrar la visita.");
    }
  };

  // ----- Estado: clientes -----
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr("");
    api.get("/customers")
      .then(r => { if (mounted) setCustomers(r.data as Customer[]); })
      .catch(e => { if (mounted) setErr(e?.response?.data?.message || e?.message || "Error cargando clientes"); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return customers;
    return customers.filter(c =>
      (c.name || "").toLowerCase().includes(s) ||
      (c.phone || "").toLowerCase().includes(s) ||
      (c.email || "").toLowerCase().includes(s)
    );
  }, [customers, q]);

  const [resendMsg, setResendMsg] = useState<Record<string, string>>({});

  const onResend = async (id: string) => {
    setResendMsg(m => ({ ...m, [id]: "Enviando…" }));
    try {
      const r = await resendCustomerQr(id);
      if (r?.queued) setResendMsg(m => ({ ...m, [id]: "✅ Enviado/encolado" }));
      else setResendMsg(m => ({ ...m, [id]: `⚠️ ${r?.reason || r?.error || "No enviado"}` }));
    } catch (e: any) {
      setResendMsg(m => ({ ...m, [id]: `❌ ${e?.response?.data?.message || e?.message}` }));
    }
  };

  return (
    <AppLayout title="Panel del Administrador" subtitle="Herramientas de negocio">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* QUICK POINTS */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">Sumar puntos por teléfono</h2>
            <form onSubmit={onQuickPoints} className="space-y-3">
              <div className="form-control">
                <label className="label"><span className="label-text">Teléfono</span></label>
                <input
                  className="input input-bordered"
                  type="tel"
                  inputMode="tel"
                  placeholder="+346XXXXXXXX"
                  value={qpPhone}
                  onChange={(e) => setQpPhone(e.target.value)}
                  required
                />
                <label className="label">
                  <span className="label-text-alt">Formato: +34…</span>
                </label>
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Notas (opcional)</span></label>
                <input
                  className="input input-bordered"
                  placeholder="Ej.: Puntos manuales"
                  value={qpNotes}
                  onChange={(e) => setQpNotes(e.target.value)}
                />
              </div>

              <button className="btn btn-primary">Sumar visita</button>
              {qpMsg && (
                <div className={`alert ${qpMsg.startsWith("❌") ? "alert-warning" : "alert-info"}`}>
                  <span>{qpMsg}</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* CLIENTES */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex items-center justify-between gap-2">
              <h2 className="card-title">Clientes</h2>
              <Link to="/app/customers" className="btn btn-ghost btn-sm">Ver listado clásico</Link>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Buscar</span></label>
              <input
                className="input input-bordered"
                placeholder="Nombre, teléfono o email…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="flex items-center gap-2"><span className="loading loading-spinner" /> Cargando…</div>
            ) : err ? (
              <div className="alert alert-warning"><span>{err}</span></div>
            ) : (
              <div className="overflow-x-auto rounded-box border border-base-300">
                <table className="table table-compact w-full">
                  <thead className="bg-base-200 sticky top-0 z-10">
                    <tr>
                      <th>Nombre</th>
                      <th className="hidden sm:table-cell">Teléfono</th>
                      <th className="hidden sm:table-cell">Email</th>
                      <th className="w-1">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => (
                      <tr key={c.id}>
                        <td className="align-top">
                          <div className="font-medium">{c.name}</div>
                          <div className="sm:hidden text-xs opacity-70">{c.phone || "—"}</div>
                          <div className="sm:hidden text-xs opacity-70">{c.email || "—"}</div>
                        </td>
                        <td className="align-top hidden sm:table-cell">{c.phone || "—"}</td>
                        <td className="align-top hidden sm:table-cell">{c.email || "—"}</td>
                        <td className="align-top">
                          <div className="join join-vertical sm:join-horizontal">
                            <Link to={`/app/customers/${c.id}`} className="btn btn-sm btn-outline join-item">Detalle</Link>
                            <button
                              className="btn btn-sm btn-outline join-item"
                              onClick={() => onResend(c.id)}
                              title="Reenviar QR por WhatsApp"
                            >
                              Reenviar QR
                            </button>
                          </div>
                          {resendMsg[c.id] && (
                            <div className="text-xs mt-1 opacity-70">{resendMsg[c.id]}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!filtered.length && (
                      <tr><td colSpan={4} className="text-sm opacity-70 p-4">Sin resultados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* STAFF – placeholder (cuando tengas API de Users) */}
        <div className="card bg-base-100 shadow-sm lg:col-span-2">
          <div className="card-body">
            <h2 className="card-title">Equipo (staff)</h2>
            <p className="text-sm opacity-80">
              Aquí podrás invitar y gestionar cuentas de staff. Si ya tienes un endpoint de usuarios,
              podemos conectar este bloque de inmediato.
            </p>
            <div className="join">
              <Link to="/app/users" className="btn btn-ghost join-item">Ir a Usuarios (si existe)</Link>
              <button className="btn btn-disabled join-item">Crear staff (próximamente)</button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
