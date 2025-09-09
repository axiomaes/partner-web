// partner-web/src/pages/LoginStaff.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { baseURL, type UserRole } from "@/shared/api";
import { saveSession, clearSession, type Session, useSession } from "@/shared/auth";

function decodeJwt(token: string): any | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return json || null;
  } catch {
    return null;
  }
}

function decodeJwtRole(token: string): UserRole | null {
  const json = decodeJwt(token);
  if (!json) return null;
  const role = (json?.role || json?.claims?.role || json?.roles)?.toString?.();
  if (!role) return null;
  const norm = role.toUpperCase();
  return (["SUPERADMIN", "OWNER", "ADMIN", "BARBER"].includes(norm) ? (norm as UserRole) : null);
}

function decodeJwtEmail(token: string): string | null {
  const json = decodeJwt(token);
  return (json?.email || json?.sub || json?.upn || null) as string | null;
}

export default function LoginStaff() {
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const s = useSession();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Si ya hay sesión lista, redirige por rol (evita “titileo”)
  useEffect(() => {
    if (!s.ready) return;
    if (!s.token) return;
    if (s.role === "SUPERADMIN") {
      nav("/cpanel", { replace: true });
    } else {
      const to = loc.state?.from && typeof loc.state.from === "string" ? loc.state.from : "/app";
      nav(to, { replace: true });
    }
  }, [s.ready, s.token, s.role, nav]); // no dependas de loc.state para evitar bucles

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

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || `Error HTTP ${res.status}`);
      }

      const token: string | undefined = data?.access_token || data?.accessToken;
      if (!token) throw new Error("No se recibió access_token.");

      // Derivamos email/role desde respuesta o JWT
      const emailFromApi: string | undefined = data?.user?.email;
      const roleFromApi: string | undefined = data?.user?.role;
      const roleFromJwt = decodeJwtRole(token) ?? (roleFromApi?.toUpperCase?.() as UserRole | null);

      const finalEmail = emailFromApi || decodeJwtEmail(token) || email;
      const finalRole: UserRole = (roleFromJwt as UserRole) ?? "BARBER";

      const session: Session = {
        email: finalEmail,
        role: finalRole,
        token,
        ready: true,
      };

      saveSession(session);

      // Redirige por rol
      if (finalRole === "SUPERADMIN") {
        nav("/cpanel", { replace: true });
      } else {
        const to = loc.state?.from && typeof loc.state.from === "string" ? loc.state.from : "/app";
        nav(to, { replace: true });
      }
    } catch (e: any) {
      setErr(e?.message || "No se pudo iniciar sesión.");
      clearSession();
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !email || !pass;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="card bg-base-100 shadow-xl w-full max-w-md">
        <div className="card-body">
          <h2 className="card-title">Acceso Staff</h2>
          {!!err && <div className="alert alert-warning">{err}</div>}
          <label className="form-control w-full">
            <span className="label-text">Email</span>
            <input
              type="email"
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="username"
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
              autoComplete="current-password"
            />
          </label>
          <div className="card-actions justify-end mt-2">
            <button className={`btn btn-primary ${loading ? "loading" : ""}`} disabled={disabled}>
              {loading ? "" : "Entrar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
