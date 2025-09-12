// src/pages/LoginStaff.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession, clearSession, saveSession, type UserRole } from "../shared/auth";
import { authLogin, postLoginPathByRole } from "../shared/api";

function decodeJwt(token: string): any {
  try {
    const b64 = token.split(".")[1];
    const json = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return {};
  }
}
function normRole(r: unknown): UserRole {
  const up = String(r || "").toUpperCase();
  return (["SUPERADMIN", "OWNER", "ADMIN", "BARBER"].includes(up) ? up : "BARBER") as UserRole;
}

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
      // Llamada flexible: admitimos varias formas de retorno
      const res: any = await authLogin(email, password);

      // Extrae token de las formas más comunes
      const token: string =
        res?.access_token ||
        res?.token ||
        res?.session?.token ||
        res?.data?.access_token ||
        "";

      if (!token) throw new Error("No se recibió token");

      // Decodifica payload para obtener role/name/businessId
      const p = decodeJwt(token);
      const role: UserRole = normRole(
        p?.role ?? p?.user?.role ?? res?.session?.role ?? res?.role
      );
      const displayName =
        p?.name ?? p?.user?.name ?? res?.session?.name ?? undefined;
      const businessId =
        p?.businessId ?? p?.bizId ?? res?.session?.businessId ?? null;

      // Guarda la sesión de forma explícita (clave: role correcto)
      saveSession({
        email: String(p?.email ?? res?.session?.email ?? email),
        role,
        token,
        ready: true,
        name: displayName,
        businessId,
      });

      // Redirección por rol (si el backend devolvió "next", lo respetamos)
      const next = res?.next || postLoginPathByRole(role);
      nav(next, { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "No autorizado");
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
