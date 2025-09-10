// partner-web/src/shared/auth.ts
import { useEffect, useMemo, useState } from "react";

export type UserRole = "SUPERADMIN" | "OWNER" | "ADMIN" | "BARBER";

export type Session = {
  email: string;
  role: UserRole;
  token: string;
  ready: boolean;
  name?: string; // opcional para cabeceras/ux
};

const KEY = "axioma.session";

// ---- Persistencia ----
export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s !== "object" || typeof s.token !== "string") {
      throw new Error("bad session");
    }
    return {
      email: String(s.email || ""),
      role: (String(s.role || "").toUpperCase() as UserRole) || "BARBER",
      token: String(s.token),
      ready: !!s.ready,
      name: s.name ? String(s.name) : undefined,
    };
  } catch {
    try { localStorage.removeItem(KEY); } catch {}
    return null;
  }
}

export function saveSession(s: Session) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession() {
  try { localStorage.removeItem(KEY); } catch {}
}

// ---- Hook de sesión ----
export function useSession(): Session {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    setSession(loadSession());
  }, []);

  // Fallback seguro para no romper la UI antes de cargar
  return useMemo(
    () =>
      session ?? {
        email: "",
        role: "BARBER",
        token: "",
        ready: true,
        name: "",
      },
    [session]
  );
}

// ---- Helpers de roles (semántica clara) ----

// Útil para checks ad-hoc
export function hasRole(session: Session, roles: UserRole[] = []): boolean {
  return roles.includes(session.role);
}

// SUPERADMIN: rol superior, control total del sistema / CPanel global
export function isSuperAdmin(session: Session): boolean {
  return session.role === "SUPERADMIN";
}

// Admin de NEGOCIO (no global): OWNER o ADMIN
// Importante: NO incluye SUPERADMIN para evitar confusiones en vistas de negocio.
export function isAdmin(session: Session): boolean {
  return session.role === "OWNER" || session.role === "ADMIN";
}

// Staff del negocio (toda la operativa diaria)
export function isBusinessStaff(session: Session): boolean {
  return session.role === "OWNER" || session.role === "ADMIN" || session.role === "BARBER";
}

// Roles atómicos (por comodidad)
export function isOwner(session: Session): boolean { return session.role === "OWNER"; }
export function isBarber(session: Session): boolean { return session.role === "BARBER"; }

// Ayudas de routing (recomendadas)
export function canAccessCPanel(session: Session): boolean {
  return isSuperAdmin(session);
}
export function canAccessBusinessPanel(session: Session): boolean {
  return isBusinessStaff(session);
}

// Helper UX para mostrar nombre
export function displayName(session: Session): string {
  return session.name || session.email || "Usuario";
}
