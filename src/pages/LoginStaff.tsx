// partner-web/src/pages/LoginStaff.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { baseURL, type UserRole } from "@/shared/api";
import { saveSession, clearSession, type Session, useSession } from "@/shared/auth";

/* ===== Helpers JWT (tolerantes) ===== */
function decodeJwt(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null; // no parece JWT -> devolvemos null
    const payload = parts[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return json || null;
  } catch {
    return null;
  }
}
const VALID_ROLES = new Set(["SUPERADMIN", "OWNER", "ADMIN", "BARBER"]);
function normRole(r?: string | null): UserRole | null {
  if (!r) return null;
  const up = r.toUpperCase();
  return VALID_ROLES.has(up) ? (up as UserRole) : null;
}
function jwtRole(token: string): UserRole | null {
  const j = decodeJwt(token);
  const raw =
    j?.role ??
    j?.claims?.role ??
    (Array.isArray(j?.roles) ? j.roles[0] : j?.roles) ??
    null;
  return normRole(typeof raw === "string" ? raw : null);
}
function jwtEmail(token: string): string | null {
  const j = decodeJwt(token);
  const e = j?.email || j?.upn || j?.sub || null;
  return typeof e === "string" ? e : null;
}

export default function LoginStaff() {
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const s = useSession();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Si ya hay sesión lista, redirige por rol (evita titileo)
  useEffect(() => {
    if (!s.ready || !s.token) return;
    if (s.role === "SUPERADMIN") {
      nav("/cpanel", { replace: true });
    } else {
      const to =
        loc.state?.from && typeof loc.state.from === "string"
          ? loc.state.from
          : "/app";
      nav(to, { replace: true });
    }
    // NO dependemos de loc.state para evitar re-render loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.ready, s.token, s.role, nav]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (loading) return;
    setLoading(true);
    try {
      const body = { email, password: pass };
      const res = await fetch(`${baseURL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message ||
            (res.status === 401
              ? "Credenciales inválidas."
              : `Error HTTP ${res.status}`)
        );
      }

      // Token puede venir como JWT o opaco
      const token: string | undefined = data?.access_token || data?.accessToken;
      if (!token || String(token).trim().length < 8) {
        throw new Error("No se recibió un access_token válido.");
      }

      // Preferimos datos del API; si faltan, intentamos desde el JWT
      const apiEmail: string | undefined = data?.user?.email;
      const apiRole: string | undefined = data?.user?.role;

      const decodedEmail = jwtEmail(token);
      const decodedRole = jwtRole(token);

      const finalEmail =
        (apiEmail && String(apiEmail)) || decodedEmail || email.trim();
      const finalRole: UserRole =
        normRole(apiRole ?? undefined) ??
        decodedRole ??
        ("BARBER" as UserRole);

      const name: string | undefined = data?.user?.name || data?.user?.fullName;
      const businessId: string | null =
        data?.user?.businessId ?? data?.user?.business_id ?? null;

      const session: Session = {
        email: finalEmail,
        role: finalRole,
        token,
        ready: true, // <- clave para evitar loops
        name,
        businessId,
      };

      saveSession(session);

      // Redirección por rol
      if (finalRole === "SUPERADMIN") {
        nav("/cpanel", { replace: true });
      } else {
        const to =
          loc.state?.from && typeof loc.state.from === "string"
            ? loc.state.from
            : "/app";
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
              inputMode="email"
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
