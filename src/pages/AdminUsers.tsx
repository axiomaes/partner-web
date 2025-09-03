import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import { listUsers, createUser /*, updateUserRole, disableUser*/ } from "@/shared/api";
import { useSession, isAdmin } from "@/shared/auth";

type User = {
  id: string;
  email: string;
  role: "ADMIN" | "BARBER" | "OWNER" | "SUPERADMIN";
  name?: string | null;
  isActive?: boolean;
  createdAt?: string;
};

export default function AdminUsers() {
  const { role } = useSession();
  const admin = isAdmin(role);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newRole, setNewRole] = useState<User["role"]>("BARBER");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const refresh = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await listUsers();
      setUsers(data as User[]);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "No se pudo cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) refresh();
  }, [admin]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg("");
    try {
      await createUser(email.trim(), password, newRole);
      setMsg("✅ Usuario creado");
      setEmail("");
      setPassword("");
      setNewRole("BARBER");
      refresh();
    } catch (e: any) {
      setMsg(`❌ ${e?.response?.data?.message || e?.message || "No se pudo crear"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = users.filter(u => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (u.email || "").toLowerCase().includes(s) || (u.role || "").toLowerCase().includes(s);
  });

  return (
    <AppLayout title="Usuarios del negocio" subtitle="Crea y gestiona cuentas del staff">
      {!admin ? (
        <div className="alert alert-warning">
          <span>No tienes permisos para ver esta sección.</span>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Crear usuario */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Crear usuario</h2>
              <form onSubmit={onCreate} className="space-y-3">
                <div className="form-control">
                  <label className="label"><span className="label-text">Email</span></label>
                  <input
                    type="email"
                    className="input input-bordered"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="usuario@empresa.com"
                  />
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text">Contraseña</span></label>
                  <input
                    type="password"
                    className="input input-bordered"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text">Rol</span></label>
                  <select
                    className="select select-bordered"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as User["role"])}
                  >
                    <option value="BARBER">BARBER (staff)</option>
                    <option value="ADMIN">ADMIN (admin del negocio)</option>
                    <option value="OWNER">OWNER</option>
                    <option value="SUPERADMIN">SUPERADMIN</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><span className="loading loading-spinner" /> Creando…</> : "Crear"}
                  </button>
                  <Link to="/app" className="btn btn-ghost">Volver al Panel</Link>
                </div>

                {msg && (
                  <div className={`alert ${msg.startsWith("❌") ? "alert-warning" : "alert-info"}`}>
                    <span>{msg}</span>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Listado */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="flex items-center justify-between gap-2">
                <h2 className="card-title">Usuarios</h2>
                <div className="join">
                  <input
                    className="input input-bordered join-item"
                    placeholder="Buscar (email/rol)…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                  <button className="btn join-item" onClick={refresh}>Refrescar</button>
                </div>
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
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th className="w-1">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(u => (
                        <tr key={u.id}>
                          <td className="align-top">{u.email}</td>
                          <td className="align-top">
                            <span className="badge badge-outline">{u.role}</span>
                          </td>
                          <td className="align-top">{u.isActive === false ? "Inactivo" : "Activo"}</td>
                          <td className="align-top">
                            <div className="join join-vertical sm:join-horizontal">
                              {/* Ejemplos para futuro:
                              <button className="btn btn-xs btn-outline join-item"
                                onClick={() => updateUserRole(u.id, u.role === "BARBER" ? "ADMIN" : "BARBER").then(refresh)}>
                                Toggle Rol
                              </button>
                              <button className="btn btn-xs btn-outline join-item"
                                onClick={() => disableUser(u.id).then(refresh)}>
                                Desactivar
                              </button>
                              */}
                              <span className="text-xs opacity-60">—</span>
                            </div>
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
        </div>
      )}
    </AppLayout>
  );
}
