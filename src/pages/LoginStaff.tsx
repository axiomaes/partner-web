// partner-web/src/pages/LoginStaff.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/shared/api";

type LoginResp = { access_token: string }; // la API devuelve access_token

function decodeJwt<T = any>(jwt: string): T | null {
  try {
    const [, payload] = jwt.split(".");
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export default function LoginStaff() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@axioma-creativa.es");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const r = await api.post<LoginResp>("/auth/login", { email: email.trim(), password });
      const accessToken = r.data?.access_token;
      if (!accessToken) throw new Error("Respuesta inválida: falta access_token");

      // Decodificar el JWT para armar el objeto user esperado por el front
      const payload = decodeJwt<any>(accessToken);
      // payload típico del backend: { sub, email, role, businessId, iat, exp }
      const user = {
        id: payload?.sub,
        email: payload?.email ?? email.trim(),
        role: payload?.role ?? "BARBER",
        businessId: payload?.businessId ?? null,
      };

      // Normalizar a la forma que usan useSession()/isAdmin(): { token, user }
      localStorage.setItem(
        "axioma_auth",
        JSON.stringify({ token: accessToken, user })
      );

      // Ir al panel admin (el guard visual verificará role)
      nav("/app/admin", { replace: true });
    } catch (err: any) {
      setMsg(err?.response?.data?.message || err?.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-base-200 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow">
        <div className="card-body">
          <h1 className="card-title">Acceso Staff / Admin</h1>
          <form onSubmit={onSubmit} className="grid gap-3">
            <div className="form-control">
              <label className="label"><span className="label-text">Email</span></label>
              <input
                className="input input-bordered"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@negocio.com"
              />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Contraseña</span></label>
              <input
                className="input input-bordered"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button className={`btn btn-primary ${loading ? "loading" : ""}`} disabled={loading}>
              {loading ? "Ingresando…" : "Ingresar"}
            </button>

            {!!msg && <div className="alert alert-warning"><span>{msg}</span></div>}

            <div className="text-xs opacity-70 flex justify-between">
              <Link to="/" className="link">Volver al inicio</Link>
              <Link to="/portal" className="link">Acceso Clientes</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
