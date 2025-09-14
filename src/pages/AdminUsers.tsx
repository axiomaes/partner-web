// src/pages/AdminUsers.tsx
import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/layout/AppLayout";
import {
  createUser,
  listUsers,
  resetUserPassword,
  type UserRole,
} from "@/shared/api";
import { useSession, isAdmin, isOwner, isSuperAdmin } from "@/shared/auth";

type Row = { id: string; email?: string | null; role?: UserRole | null };

export default function AdminUsers() {
  const s = useSession();
  const admin = isAdmin(s.role);
  const owner = isOwner(s.role);
  const superadmin = isSuperAdmin(s.role);

  // Permisos: ADMIN solo puede crear BARBER; OWNER/SUPERADMIN pueden crear ADMIN o BARBER
  const canCreateAdmin = owner || superadmin;
  const canCreateBarber = admin || owner || superadmin;
  const canCreateSomeone = canCreateAdmin || canCreateBarber;

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(canCreateAdmin ? "ADMIN" : "BARBER");
  const [submitting, setSubmitting] = useState(false);

  // Mapa de contraseñas temporales mostradas por userId
  const [tempPassById, setTempPassById] = useState<Record<string, string>>({});
  const [busyResetById, setBusyResetById] = useState<Record<string, boolean>>({});

  const roleOptions = useMemo<UserRole[]>(
    () => (canCreateAdmin ? ["ADMIN", "BARBER"] : ["BARBER"]),
    [canCreateAdmin]
  );

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");
    listUsers()
      .then((data) => alive && setRows((Array.isArray(data) ? data : []) as any))
      .catch((e) => alive && setErr(e?.response?.data?.message || e?.message || "No se pudo cargar usuarios."))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreateSomeone) return;
    try {
      setSubmitting(true);
      setErr("");
      const r = await createUser(email.trim(), password, role);
      setRows((prev) => [r as any, ...prev]);
      setEmail("");
      setPassword("");
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "No se pudo crear el usuario.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onResetPassword(user: Row) {
    const id = String(user.id);
    // Reglas: superadmin/owner → todos; admin → solo BARBER
    const canResetThis =
      superadmin || owner || (admin && (user.role === "BARBER"));
    if (!canResetThis) return;

    setBusyResetById((m) => ({ ...m, [id]: true }));
    setErr("");
    try {
      const r = await resetUserPassword(id);
      const tmp = (r?.tempPassword ?? "").toString(); // <-- fuerza string
      setTempPassById((m) => ({ ...m, [id]: tmp || "(generada)" }));
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "No se pudo resetear la contraseña.");
    } finally {
      setBusyResetById((m) => ({ ...m, [id]: false }));
    }
  }

  return (
    <AppLayout title="Usuarios (staff)" subtitle="Gestiona el equipo del negocio">
      {!admin && (
        <div className="alert alert-warning mb-4">
          <span>Tu rol no tiene acceso completo a esta sección.</span>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Crear usuario */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title">Invitar / crear usuario</h3>

            {!canCreateSomeone ? (
              <p className="text-sm opacity-70">Tu rol no puede crear usuarios.</p>
            ) : (
              <form onSubmit={onCreate} className="space-y-3">
                <div className="form-control">
                  <label className="label"><span className="label-text">Correo</span></label>
                  <input
                    className="input input-bordered"
                    type="email"
                    placeholder="correo@dominio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text">Contraseña</span></label>
                  <input
                    className="input input-bordered"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text">Rol</span></label>
                  <select
                    className="select select-bordered"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                  >
                    {roleOptions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  {!canCreateAdmin && <span className="label-text-alt">Como {s.role}, solo puedes crear BARBER.</span>}
                </div>

                <button className={`btn btn-primary ${submitting ? "loading" : ""}`} disabled={submitting}>
                  {submitting ? "" : "Crear usuario"}
                </button>

                {err && <div className="alert alert-warning"><span>{err}</span></div>}
              </form>
            )}
          </div>
        </div>

        {/* Listado */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title">Usuarios</h3>
            {loading ? (
              <div className="flex items-center gap-2"><span className="loading loading-spinner" />Cargando…</div>
            ) : err ? (
              <div className="alert alert-warning"><span>{err}</span></div>
            ) : (
              <div className="overflow-x-auto rounded-box border border-base-300">
                <table className="table table-compact w-full">
                  <thead className="bg-base-200 sticky top-0 z-10">
                    <tr>
                      <th>Email</th>
                      <th>Rol</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((u) => {
                      const canResetThis =
                        superadmin || owner || (admin && (u.role === "BARBER"));
                      const busy = !!busyResetById[String(u.id)];
                      const tempShown = tempPassById[String(u.id)] ?? "";
                      return (
                        <tr key={u.id}>
                          <td>{u.email || "—"}</td>
                          <td>{u.role || "—"}</td>
                          <td className="text-right">
                            <div className="join">
                              <button
                                className={`btn btn-xs join-item ${busy ? "loading" : ""}`}
                                disabled={!canResetThis || busy}
                                onClick={() => onResetPassword(u)}
                                title={canResetThis ? "Resetear contraseña" : "Sin permisos"}
                              >
                                {busy ? "" : "Resetear contraseña"}
                              </button>
                              {tempShown && (
                                <button
                                  className="btn btn-xs btn-ghost join-item"
                                  onClick={() => {
                                    navigator.clipboard?.writeText(tempShown);
                                  }}
                                  title="Copiar contraseña temporal"
                                >
                                  Copiar temp
                                </button>
                              )}
                            </div>
                            {tempShown && (
                              <div className="text-xs opacity-70 mt-1">
                                Temporal: <code className="font-mono">{tempShown}</code>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {rows.length === 0 && (
                      <tr><td colSpan={3} className="p-4 text-sm opacity-70">Sin usuarios.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
