import { useState } from "react";
import { api } from "../shared/api";
import { saveAuth } from "../shared/auth";
import { useNavigate } from "react-router-dom";

export default function LoginStaff() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });

      // Esperamos { token, user }, pero soportamos { access_token } también.
      const data = res.data || {};
      const token: string = data.token || data.access_token;
      const user = data.user || { id: "me", email, role: (data.role || "BARBER") as any };

      if (!token) throw new Error("Respuesta sin token");

      saveAuth(token, user);
      navigate("/dashboard", { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-4"
      >
        <h1 className="text-xl font-semibold">Acceso de Staff</h1>
        {err && <p className="text-sm text-red-600">{err}</p>}

        <label className="block text-sm">
          Email
          <input
            className="mt-1 w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            type="email"
            value={email}
            autoComplete="username"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="block text-sm">
          Contraseña
          <input
            className="mt-1 w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button
          disabled={loading}
          className="w-full rounded-md bg-blue-600 text-white font-medium py-2 disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
