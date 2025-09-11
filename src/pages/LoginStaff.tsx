// src/pages/LoginStaff.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession, clearSession } from "../shared/auth";
import { authLogin, postLoginPathByRole } from "../shared/api";

export default function LoginStaff() {
  const nav = useNavigate();
  const s = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      // Centraliza login + persistencia de sesión
      const { session, next } = await authLogin(email, password);
      // Redirección por rol
      nav(next || postLoginPathByRole(session.role), { replace: true });
    } catch (e: any) {
      setErr(e?.message || "No autorizado");
    } finally {
      setSubmitting(false);
    }
  }

  function goToMyPanel() {
    const next = postLoginPathByRole(s.role);
    nav(next, { replace: true });
  }

  function doLogout() {
    clearSession();
    // nos quedamos en /login mostrando el formulario limpio
    nav("/login", { replace: true });
  }

  // UX: foco en email la primera vez
  useEffect(() => {
    const el = document.getElementById("login-email") as HTMLInputElement | null;
    el?.focus();
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420, display: "grid", gap: 12 }}>
        {/* Aviso si ya hay sesión activa (no redirigimos automáticamente) */}
        {s.ready && s.token && (
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ fontSize: 14, lineHeight: 1.4 }}>
              Ya hay una sesión activa
              {s.email ? ` (${s.email})` : ""}. Puedes entrar a tu panel
              o cerrar sesión para iniciar con otra cuenta.
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={goToMyPanel}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: 0,
                  background: "#111827",
                  color: "white",
                  fontWeight: 600,
                }}
              >
                Ir a mi panel
              </button>
              <button
                onClick={doLogout}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  background: "white",
                  color: "#111827",
                  fontWeight: 600,
                }}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {/* Formulario de login */}
        <form
          onSubmit={onSubmit}
          style={{
            width: "100%",
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
    </div>
  );
}
