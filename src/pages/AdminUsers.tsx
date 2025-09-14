// src/pages/AdminUsers.tsx
import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/layout/AppLayout";
import {
  createUser,
  listUsers,
  updateUser,
  resetUserPassword,
  type UserRole,
  type UserLite,
} from "@/shared/api";
import { useSession, isAdmin, isOwner, isSuperAdmin } from "@/shared/auth";

type Row = (UserLite & { _dirty?: boolean; _saving?: boolean }) & {
  email: string; // asegurar email visible en tabla
  role: UserRole; // asegurar rol visible en tabla
};

export default function AdminUsers() {
  const s = useSession();
  const admin = isAdmin(s.role);
  const owner = isOwner(s.role);
  const superadmin = isSuperAdmin(s.role);

  // Permisos
  const canCreateAdmin = owner || superadmin;
  const canCreateBarber = admin || owner || superadmin;
  const canCreateSomeone = canCreateAdmin || canCreateBarber;
  const canEditRole = owner || superadmin; // ADMIN no cambia roles
  const canResetPasswords = admin || owner || superadmin;

  // Crear usuario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const defaultRole: UserRole = canCreateAdmin ? "ADMIN" : "BARBER";
  const [role, setRole] = useState<UserRole>(defaultRole);
  const roleOptions = useMemo<UserRole[]>(
    () => (canCreateAdmin ? ["ADMIN", "BARBER"] : ["BARBER"]),
    [canCreateAdmin]
  );
  const [submitting, setSubmitting] = useState(false);

  // Listado
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  // Modal de contraseña temporal
  const [tempPass, setTempPass] = useState<{ userId: string; value: string } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const data = await listUsers(q.trim() || undefined);
        if (!alive) return;
        const norm: Row[] = (data as UserLite[]).map((u) => ({
          id: u.id,
          email: String(u.email || ""),
          name: u.name || "",
          role: (u.role as UserRole) || "BARBER",
          active: u.active ?? true,
          _dirty: false,
          _saving: false,
        }));
        setRows(norm);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.response?.data?.message || e?.message || "No se pudo cargar usuarios.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [q]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreateSomeone) return;
    try {
      setSubmitting(true);
      setErr("");
      const created = await createUser(email.trim(), password, role); // ✅ 3 args ok
      // normalize to Row
      const r: Row = {
        id: (created as any)?.id,
        email: (created as any)?.email || email.trim(),
        name: (created as any)?.name || "",
        role: ((created as any)?.role as UserRole) || role,
        active: (created as any)?.active ?? true,
        _dirty: false,
        _saving: false,
      };
      setRows((prev) => [r, ...prev]);
      setEmail("");
      setPassword("");
      setRole(defaultRole);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "No se pudo crear el usuario.");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveRow(row: Row) {
    try {
      row._saving = true;
      setRows([...rows]);
      const patch: Partial<UserLite> = { name: row.name ?? "" };

      // Rol solo editable por OWNER/SUPERADMIN
      if (canEditRole && row.role) {
        if (row.role === "SUPERADMIN" && !superadmin) {
          // no permitir subir a SUPERADMIN si no lo eres
        } else {
          patch.role = row.role;
        }
      }

      const updated = await updateUser(row.id, patch); // ✅ 2 args
      Object.assign(row, {
        name: updated.name ?? row.name,
        role: (updated.role as UserRole) ?? row.role,
        active: updated.active ?? row.active,
        _dirty: false,
        _saving: false,
      });
      setRows([...rows]);
    } catch (e: any) {
      row._saving = false;
      setRows([...rows]);
      setErr(e?.response?.data?.message || e?.message || "No se pudo guardar los cambios.");
    }
  }

  async function doResetPass(userId: string) {
    if (!canResetPasswords) return;
    try {
      setErr("");
      const { tempPassword } = await resetUserPassword(userId); // ✅ 1 arg
      setTempPass({ userId, value: tempPassword });
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "No se pudo resetear la contraseña.");
    }
  }

  return (
    <AppLayout title="Usuarios (staff)" subtitle="Gestiona el equipo del negocio">
      {!admin && (
        <div className="alert alert-warning mb-4">
          <span>Tu rol no tiene acceso completo a esta sección.</span>
        </div>
      )}

      {/* Modal contraseña temporal */}
      <input type="checkbox" className="modal-toggle" checked={!!tempPass} readOnly />
      {tempPass && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-2">Contraseña temporal generada</h3>
            <p className="text-sm opacity-80">Cópiala y entrégala al usuario. Se mostrará una sola vez.</p>
            <div className="mt-3 p-3 bg-base-200 rounded font-mono text-sm break-all">
              {tempPass.value}
            </div>
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => navigator.clipboard?.writeText(tempPass.value)}
              >
                Copiar
              </button>
              <button className="btn btn-primary" onClick={() => setTempPass(null)}>
                Cerrar
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setTempPass(null)} />
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
                  {!canCreateAdmin && (
                    <span className="label-text-alt">
                      Como {s.role}, solo puedes crear BARBER.
                    </span>
                  )}
                </div>

                <button className={`btn btn-primary ${submitting ? "loading" : ""}`} disabled={submitting}>
                  {submitting ? "" : "Crear usuario"}
                </button>

                {err && (
                  <div className="alert alert-warning">
                    <span>{err}</span>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Listado / edición */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex items-center justify-between gap-2">
              <h3 className="card-title">Usuarios</h3>
              <div className="flex items-center gap-2">
                <input
                  className="input input-bordered input-sm"
                  placeholder="Buscar por nombre o email…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <button className="btn btn-ghost btn-sm" onClick={() => setQ("")}>Limpiar</button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 mt-2">
                <span className="loading loading-spinner" />
                Cargando…
              </div>
            ) : err ? (
              <div className="alert alert-warning mt-2"><span>{err}</span></div>
            ) : (
              <div className="overflow-x-auto rounded-box border border-base-300 mt-2">
                <table className="table table-compact w-full">
                  <thead className="bg-base-200 sticky top-0 z-10">
                    <tr>
                      <th>Nombre</th>
                      <th className="hidden md:table-cell">Email</th>
                      <th>Rol</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <input
                            className="input input-sm input-bordered w-full"
                            value={u.name || ""}
                            onChange={(e) => {
                              u.name = e.target.value;
                              u._dirty = true;
                              setRows([...rows]);
                            }}
                          />
                        </td>
                        <td className="hidden md:table-cell">{u.email || "—"}</td>
                        <td>
                          <select
                            className="select select-sm select-bordered"
                            value={u.role}
                            disabled={!canEditRole || u._saving || (!superadmin && u.role === "SUPERADMIN")}
                            onChange={(e) => {
                              u.role = e.target.value as UserRole;
                              u._dirty = true;
                              setRows([...rows]);
                            }}
                          >
                            <option value="BARBER">BARBER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="OWNER">OWNER</option>
                            {superadmin && <option value="SUPERADMIN">SUPERADMIN</option>}
                          </select>
                        </td>
                        <td className="text-right">
                          <div className="join">
                            <button
                              className={`btn btn-xs join-item ${u._saving ? "loading" : ""}`}
                              disabled={!u._dirty || u._saving}
                              onClick={() => saveRow(u)}
                            >
                              {u._saving ? "" : "Guardar"}
                            </button>
                            {canResetPasswords && (
                              <button
                                className="btn btn-outline btn-xs join-item"
                                onClick={() => doResetPass(u.id)}
                              >
                                Reset password
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-sm opacity-70">
                          Sin usuarios.
                        </td>
                      </tr>
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
