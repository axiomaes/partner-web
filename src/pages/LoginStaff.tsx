// partner-web/src/pages/LoginStaff.tsx
import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { BRAND } from "@/shared/brand";
import { saveSession } from "@/shared/session";

type JwtClaims = {
  sub: string;
  email?: string;
  role?: string;
  businessId?: string;
  iat?: number;
  exp?: number;
};

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");
const AUTH_PATHS: string[] = (
  import.meta.env.VITE_API_AUTH_PATHS || "/auth/login,/api/auth/login,/login"
)
  .split(",")
  .map((p: string) => p.trim())   // <- tipado explícito para evitar TS7006
  .filter(Boolean);

// decode JWT sin validar firma (solo para leer claims en cliente)
function parseJwt(token: string): JwtClaims | null {
  try {
    const [, payload] = token.split(".");
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

export default function LoginStaff() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const nav = useNavigate();
  const location = useLocation() as any;

  const afterLogin = () => {
    const to = location.state?.from || "/app";
    nav(to, { replace: true });
  };

  async function tryLogin(): Promise<{ access_token: string; user?: any }> {
    const body = JSON.stringify({ email, password });

    for (const path of AUTH_PATHS) {
      const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (res.status === 404) continue; // probar siguiente ruta

      if (res.status === 401) throw new Error("Credenciales inválidas.");
      if (!res.ok && res.status !== 201) {
        throw new Error(`Error del servidor (código ${res.status}).`);
      }

      return await res.json(); // éxito 200/201
    }

    throw new Error(
      "No se encontró el endpoint de autenticación (404). Revisa VITE_API_BASE o VITE_API_AUTH_PATHS."
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const data = await tryLogin();

      const token: string = (data as any).access_token || (data as any).token;
      if (!token) throw new Error("Respuesta sin token.");

      let user = (data as any).user;
      if (!user) {
        const claims = parseJwt(token);
        if (!claims?.sub) throw new Error("Token inválido.");
        user = {
          id: claims.sub,
          name: claims.email?.split("@")[0] || "Usuario",
          email: claims.email || email,
          role: claims.role || "ADMIN",
          businessId: claims.businessId,
        };
      }

      saveSession(
        {
          id: String(user.id),
          name: user.name ?? "",
          email: user.email ?? email,
          role: user.role ?? "ADMIN",
        },
        token
      );

      afterLogin();
    } catch (err: any) {
      setMsg(err?.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-sm bg-base-100 shadow">
        <div className="card-body">
          <div className="flex items-center gap-2 mb-2">
            <img src={BRAND.logoUrl} alt={BRAND.name} className="h-6 w-auto" />
            <h1 className="text-lg font-semibold">Acceso Staff</h1>
          </div>

          <form className="grid gap-3" onSubmit={onSubmit}>
            <label className="form-control">
              <span className="label-text">Email</span>
              <input
                className="input input-bordered"
                type="email"
                placeholder="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="form-control">
              <span className="label-text">Contraseña</span>
              <input
                className="input input-bordered"
                type="password"
                placeholder="contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <button className={`btn btn-primary ${loading ? "loading" : ""}`} disabled={loading}>
              Entrar
            </button>
          </form>

          {!!msg && <div className="alert alert-warning mt-3 text-sm">{msg}</div>}

          <div className="mt-2 text-xs opacity-70">
            ¿Eres cliente? <Link to="/portal" className="link">Ir al Portal</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
