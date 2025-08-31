import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../shared/api";

export default function LoginStaff() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@axioma-creativa.es");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data || {};
      if (token) {
        // Persistimos en localStorage para que el interceptor lo use
        localStorage.setItem("auth", JSON.stringify({ token, user }));
      }
      nav("/dashboard");
    } catch (e: any) {
      const msg =
        e?.response?.status === 401
          ? "Credenciales inválidas."
          : e?.response?.data?.message || e?.message || "Error al iniciar sesión.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-app">
      <div className="card mx-auto max-w-sm">
        <div className="card-body">
          <h1 className="text-xl font-semibold">Acceso Staff</h1>
          <p className="text-sm text-slate-600">
            Usa tu correo corporativo para ingresar al panel.
          </p>

          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <label className="block">
              <span className="text-sm font-medium">Correo</span>
              <input
                className="input mt-1"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@negocio.com"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Contraseña</span>
              <input
                className="input mt-1"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </label>

            {err && (
              <div className="rounded border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                {err}
              </div>
            )}

            <button className="button button-primary w-full" disabled={loading}>
              {loading ? "Ingresando…" : "Entrar"}
            </button>
          </form>

          <div className="mt-3 text-center">
            <button
              type="button"
              className="text-xs text-slate-500 underline"
              onClick={() => alert("Contacta al administrador para recuperar acceso.")}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
