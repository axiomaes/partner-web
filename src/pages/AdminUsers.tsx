// partner-web/src/pages/AdminUsers.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import { api } from "@/shared/api";
import { useSession } from "@/shared/auth";

type Role = "ADMIN" | "BARBER" | "OWNER" | "SUPERADMIN";
type User = {
  id: string;
  email: string;
  role: Role;
  isActive?: boolean;
  createdAt?: string;
};

export default function AdminUsers() {
  const { token } = useSession();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState("");

  // form crear
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [role, setRole] = useState<Role>("BARBER");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setErr("");
    try {
      const r = await api.get("/users");
      setUsers(r.data as User[]);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter(u =>
      (u.email || "").toLowerCase().includes(s) ||
      (u.role || "").toLowerCase().includes(s)
    );
  }, [users, q]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateMsg("");
    setCreating(true);
    try {
      await api.post("/users", { email: email.trim(), password: pass, role });
      setCreateMsg("✅ Usuario creado");
      setEmail(""); setPass(""); setRole("BARBER");
      await load();
    } catch (e: any) {
      setCreateMsg(`❌ ${e?.response?.data?.message || e?.message || "No se pudo crear"}`);
    } finally {
      setCreating(false);
    }
  };

  const onToggleActive = async (id: string, active: boolean | undefined) => {
    try {
      await api.patch(`/users/${id}`, { isActive: !active });
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "No se pudo actualizar");
    }
  };

  const onChangeRole = async (id: string, newRole: Role) => {
    try {
      await api.patch(`/users/${id}`, { role: newRole });
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "No se pudo cambiar el rol");
    }
  };

  const onResetPassword = async (id: string) => {
    const newPass = prompt("Nueva contraseña temporal:");
    if (!newPass) return;
    try {
      await api.post(`/users/${id}/reset-password`, { password: newPass });
      alert("Contraseña actualizada");
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "No se pudo cambiar la contraseña");
    }
  };

  return (
    <AppLayout title="Usuarios" subtitle="Gestión de cuentas y roles">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Crear usuario */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">Crear usuario</h2>
            <form onSubmit={onCreate} className="grid gap-3">
              <div className="form-control">
                <label className="label"><span className="label-text">Email</span></label>
                <input
                  className="input input-bordered"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@tu-negocio.com"
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Contraseña</span></label>
                <input
                  className="input input-bordered"
                  type="password"
                  required
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="Contraseña temporal"
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Rol</span></label>
                <select
                  className="select select-bordered"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  <option value="BARBER">BARBER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="OWNER">OWNER</option>
                  <option value="SUPERADMIN">SUPERADMIN</option>
                </select>
              </div>
              <button className={`btn btn-primary ${creating ? "loading" : ""}`} disabled={creating}>
                {creating ? "Creando…" : "Crear usuario"}
              </button>
              {!!createMsg && (
                <div className={`alert ${createMsg.startsWith("✅") ? "alert-success" : "alert-warning"}`}>
                  <span>{createMsg}</span>
                </div>
              )}
              <div className="text-xs opacity-70">
                Consejo: crea al menos 1 ADMIN (o OWNER) para acceder al Panel del Administrador.
              </div>
            </form>
          </div>
        </div>

        {/* Listado */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex items-center justify-between gap-2">
              <h2 className="card-title">Usuarios</h2>
              <Link to="/app/admin" className="btn btn-ghost btn-sm">Volver al Panel</Link>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Buscar</span></label>
              <input
                className="input input-bordered"
                placeholder="Email o rol…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="flex items-center gap-2 mt-3"><span className="loading loading-spinner" /> Cargando…</div>
            ) : err ? (
              <div className="alert alert-warning mt-3"><span>{err}</span></div>
            ) : (
              <div className="overflow-x-auto rounded-box border border-base-300 mt-3">
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
                        <td>{u.email}</td>
                        <td>
                          <select
                            className="select select-bordered select-xs"
                            value={u.role}
                            onChange={(e) => onChangeRole(u.id, e.target.value as Role)}
                          >
                            <option value="BARBER">BARBER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="OWNER">OWNER</option>
                            <option value="SUPERADMIN">SUPERADMIN</option>
                          </select>
                        </td>
                        <td>
                          <span className={`badge ${u.isActive === false ? "badge-ghost" : "badge-success"}`}>
                            {u.isActive === false ? "Inactivo" : "Activo"}
                          </span>
                        </td>
                        <td>
                          <div className="join join-vertical sm:join-horizontal">
                            <button
                              className="btn btn-xs btn-outline join-item"
                              onClick={() => onToggleActive(u.id, u.isActive)}
                              title="Activar/Desactivar"
                            >
                              {u.isActive === false ? "Activar" : "Desactivar"}
                            </button>
                            <button
                              className="btn btn-xs btn-outline join-item"
                              onClick={() => onResetPassword(u.id)}
                              title="Resetear contraseña"
                            >
                              Reset pass
                            </button>
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
    </AppLayout>
  );
}
