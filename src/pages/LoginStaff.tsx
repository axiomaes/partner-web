// src/pages/LoginStaff.tsx
import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useSession } from "../shared/auth";
import { authLogin, postLoginPathByRole } from "../shared/api";

export default function LoginStaff() {
  const nav = useNavigate();
  const s = useSession();

  // Si ya hay sesión válida, manda directo a su destino
  if (s.ready && s.token) {
    return <Navigate to={postLoginPathByRole(s.role)} replace />;
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      // Centraliza login y persistencia de sesión
      const { session, next } = await authLogin(email, password);

      // Redirección por rol
      nav(next || postLoginPathByRole(session.role), { replace: true });
    } catch (e: any) {
      setErr(e?.message || "No autorizado");
    } finally {
      setSubmitting(false);
    }
  }

  // UX: foco en email la primera vez
  useEffect(() => {
    const el = document.getElementById("login-email") as HTMLInputElement | null;
    el?.focus();
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <form
        onSubmit={onSubmit}
        style={{
          width: "100%",
          maxWidth: 380,
          display: "grid",
          gap: 12,
          padding: 24,
          borderRadius: 16,
          boxShadow: "0 6px 24px rgba(0,0,0,.08)",
          background: "white",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Iniciar sesión</h1>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, opacity: 0.75 }}>Correo</span>
          <input
            id="login-email"
            type="email"
            placeholder="correo@dominio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            style={{ padding: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, opacity: 0.75 }}>Contraseña</span>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{ padding: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}
          />
        </label>

        <button
          disabled={submitting}
          type="submit"
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: 0,
            background: "#111827",
            color: "white",
            fontWeight: 600,
          }}
        >
          {submitting ? "Entrando…" : "Entrar"}
        </button>

        {err && (
          <div style={{ color: "crimson", fontSize: 13, lineHeight: 1.4 }}>
            {String(err)}
          </div>
        )}
      </form>
    </div>
  );
}
