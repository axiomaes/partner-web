import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { BRAND } from "@/shared/brand";
import { saveSession } from "@/shared/session";

type Role = "ADMIN" | "BARBER" | "OWNER" | "SUPERADMIN";
type LoginResponse = {
  token: string;
  user: { id: string | number; name?: string; email: string; role: Role };
};

const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/+$/, "");
const DEV_ENABLED = String(import.meta.env.VITE_DEV_LOGIN ?? "true") === "true";
const DEV_EMAIL =
  import.meta.env.VITE_DEV_SUPERADMIN_EMAIL || "admin@axioma-creativa.es";
const DEV_PASS = import.meta.env.VITE_DEV_SUPERADMIN_PASS || "Admin123!";

export default function LoginStaff() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const nav = useNavigate();
  const location = useLocation() as any;

  const afterLogin = () => {
    const to = location.state?.from || "/app";
    nav(to, { replace: true });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");

    const emailNorm = email.trim().toLowerCase();
    const passNorm = password.trim();

    if (!emailNorm || !passNorm) {
      setMsg("Completa email y contraseña.");
      return;
    }

    setLoading(true);

    // 1) Intento real contra API
    if (API_BASE) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 12000);

        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailNorm, password: passNorm }),
          signal: ctrl.signal,
        });

        clearTimeout(t);

        if (res.ok) {
          const data = (await res.json()) as LoginResponse;
          const u = data.user ?? ({} as LoginResponse["user"]);
          saveSession(
            {
              id: String(u.id ?? "unknown"),
              name: u.name ?? emailNorm,
              email: u.email ?? emailNorm,
              role: (u.role as Role) ?? "ADMIN",
            },
            data.token
          );
          setLoading(false);
          return afterLogin();
        }

        if (res.status === 401 || res.status === 403) {
          // sigue a bypass si está habilitado
        } else {
          setMsg(`No se pudo iniciar sesión (código ${res.status}).`);
          setLoading(false);
          return;
        }
      } catch (err: any) {
        if (err?.name === "AbortError") {
          setMsg("Tiempo de espera agotado. Intenta de nuevo.");
        } else {
          setMsg("Servidor no disponible. Revisa tu conexión.");
        }
        // seguirá al bypass si está activo
      }
    }

    // 2) Bypass dev opcional (solo si está habilitado)
    if (DEV_ENABLED && emailNorm === DEV_EMAIL && passNorm === DEV_PASS) {
      saveSession(
        {
          id: "dev-superadmin",
          name: "Super Admin",
          email: emailNorm,
          role: "SUPERADMIN",
        },
        "dev-token"
      );
      setLoading(false);
      return afterLogin();
    }

    setMsg("Email o contraseña incorrectos.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-sm bg-base-100 shadow">
        <div className="card-body">
          <div className="flex items-center gap-2 mb-2">
            <img src={BRAND.logoUrl} alt={BRAND.name} className="h-6 w-auto" />
            <h1 className="text-lg font-semibold">Acceso Staff</h1>
          </div>

          <form className="grid gap-3" onSubmit={onSubmit} noValidate>
            <label className="form-control">
              <span className="label-text">Email</span>
              <input
                className="input input-bordered"
                type="email"
                placeholder="correo@tu-negocio.com"
                autoFocus
                autoComplete="username"
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="form-control">
              <span className="label-text">Contraseña</span>
              <div className="join w-full">
                <input
                  className="input input-bordered join-item w-full"
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  disabled={loading}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-ghost join-item"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                  disabled={loading}
                >
                  {showPwd ? "🙈" : "👁️"}
                </button>
              </div>
            </label>

            <button
              className={`btn btn-primary ${loading ? "loading" : ""}`}
              disabled={loading}
              aria-busy={loading}
            >
              Entrar
            </button>
          </form>

          {!!msg && (
            <div className="alert alert-warning mt-2 text-sm">
              {msg}
            </div>
          )}

          <div className="mt-2 text-xs opacity-70">
            ¿Eres cliente?{" "}
            <Link to="/portal" className="link">
              Ir al Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
