import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { BRAND } from "@/shared/brand";
import { saveSession } from "@/shared/session";

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      // 1) INTENTO REAL contra API (ajusta la URL si tu endpoint es otro)
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json(); // espera { token, user: { id, name, email, role } }
        const user = data.user ?? {};
        saveSession(
          {
            id: String(user.id ?? "unknown"),
            name: user.name ?? "",
            email: user.email ?? email,
            role: user.role ?? "ADMIN",
          },
          data.token
        );
        setLoading(false);
        return afterLogin();
      }

      // 2) BYPASS DEV (si no hay backend o devuelve 401)
      const DEV_EMAIL =
        import.meta.env.VITE_DEV_SUPERADMIN_EMAIL || "admin@axioma-creativa.es";
      const DEV_PASS = import.meta.env.VITE_DEV_SUPERADMIN_PASS || "admin123";

      if (email === DEV_EMAIL && password === DEV_PASS) {
        saveSession(
          {
            id: "dev-superadmin",
            name: "Super Admin",
            email,
            role: "SUPERADMIN",
          },
          "dev-token"
        );
        setLoading(false);
        return afterLogin();
      }

      setMsg("Credenciales inválidas.");
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
            <input
              className="input input-bordered"
              type="email"
              placeholder="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="input input-bordered"
              type="password"
              placeholder="contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className={`btn btn-primary ${loading ? "loading" : ""}`} disabled={loading}>
              Entrar
            </button>
          </form>
          {!!msg && <div className="alert alert-warning mt-2 text-sm">{msg}</div>}
          <div className="mt-2 text-xs opacity-70">
            ¿Eres cliente? <Link to="/portal" className="link">Ir al Portal</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
