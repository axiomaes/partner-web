// partner-web/src/pages/LoginStaff.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { baseURL, type UserRole } from "@/shared/api";
import { saveSession, clearSession, type Session } from "@/shared/auth";

function decodeJwtRole(token: string): UserRole | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    const role = (json?.role || json?.claims?.role || json?.roles)?.toString?.();
    if (!role) return null;
    const norm = role.toUpperCase();
    if (["SUPERADMIN", "OWNER", "ADMIN", "BARBER"].includes(norm)) return norm as UserRole;
    return null;
  } catch {
    return null;
  }
}

export default function LoginStaff() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`${baseURL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Error HTTP ${res.status}`);
      }
      const data = await res.json();
      const token: string | undefined = data?.access_token || data?.accessToken;
      if (!token) throw new Error("No se recibió access_token.");

      // Role desde el JWT si viene; si no, BARBER por defecto
      const role = decodeJwtRole(token) ?? ("BARBER" as UserRole);

      // ✅ Armar objeto Session (incluye ready:true)
      const session: Session = {
        email,
        role,
        token,
        ready: true,
      };

      saveSession(session);
      nav("/app", { replace: true });
    } catch (e: any) {
      setErr(e?.message || "No se pudo iniciar sesión.");
      clearSession();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="card bg-base-100 shadow-xl w-full max-w-md">
        <div className="card-body">
          <h2 className="card-title">Acceso Staff</h2>
          {err && <div className="alert alert-warning">{err}</div>}
          <label className="form-control w-full">
            <span className="label-text">Email</span>
            <input
              type="email"
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text">Contraseña</span>
            <input
              type="password"
              className="input input-bordered w-full"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
            />
          </label>
          <div className="card-actions justify-end mt-2">
            <button className={`btn btn-primary ${loading ? "loading" : ""}`} disabled={loading}>
              {loading ? "" : "Entrar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
