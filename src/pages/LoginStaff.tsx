// partner-web/src/pages/LoginStaff.tsx
import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { BRAND } from "@/shared/brand";
import { saveSession } from "@/shared/session";

type ApiUser = { id: string; name: string; email: string; role: string };

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");
// Puedes sobreescribir las rutas con VITE_API_AUTH_PATHS="/auth/login,/api/auth/login,/login"
const AUTH_PATHS: string[] = (import.meta.env.VITE_API_AUTH_PATHS ||
  "/auth/login,/api/auth/login,/login")
  .split(",")
  .map(p => p.trim())
  .filter(Boolean);

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

  async function tryLogin(): Promise<{ token: string; user: ApiUser }> {
    const body = JSON.stringify({ email, password });

    // Intentamos en cadena las posibles rutas de auth
    for (const path of AUTH_PATHS) {
      const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });

        if (res.status === 404) {
          // Ruta no existe → probamos la siguiente
          continue;
        }

        if (res.status === 401) {
          throw new Error("Credenciales inválidas.");
        }

        if (!res.ok) {
          throw new Error(`Error del servidor (código ${res.status}).`);
        }

        // Éxito
        return await res.json();
      } catch (e) {
        // Si fue 404 ya se continúa; otros errores se propagan al finalizar el bucle
        if ((e as Error).message.includes("404")) continue;
        // seguimos intentando otras rutas; si ninguna sirve, lanzamos el último error
      }
    }

    throw new Error(
      "No se encontró el endpoint de autenticación en el API (404). " +
        "Revisa VITE_API_BASE o define VITE_API_AUTH_PATHS."
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      // 1) intento real contra API (con fallbacks)
      const data = await tryLogin();
      const user = data.user ?? ({} as ApiUser);

      saveSession(
        {
          id: String(user.id ?? "unknown"),
          name: user.name ?? "",
          email: user.email ?? email,
          role: user.role ?? "ADMIN",
        },
        data.token
      );
      afterLogin();
      return;
    } catch (err: any) {
      // 2) bypass DEV opcional
      const devOn = String(import.meta.env.VITE_DEV_LOGIN || "").toLowerCase() === "true";
      const DEV_EMAIL =
        import.meta.env.VITE_DEV_SUPERADMIN_EMAIL || "admin@axioma-creativa.es";
      const DEV_PASS = import.meta.env.VITE_DEV_SUPERADMIN_PASS || "admin123";

      if (devOn && email === DEV_EMAIL && password === DEV_PASS) {
        saveSession(
          {
            id: "dev-superadmin",
            name: "Super Admin",
            email,
            role: "SUPERADMIN",
          },
          "dev-token"
        );
        afterLogin();
        return;
      }

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
