// partner-web/src/shared/auth.ts
import { useEffect, useMemo, useState } from "react";

export type UserRole = "SUPERADMIN" | "OWNER" | "ADMIN" | "BARBER";

/**
 * SUPERADMIN  → controla TODO el sistema (CPanel global).
 * OWNER/ADMIN → administran su propio negocio.
 * BARBER      → operativa diaria (crear cliente, añadir visita, etc.).
 */
export type Session = {
  email: string;
  role: UserRole;
  token: string;
  ready: boolean;
  name?: string; // opcional: usado en cabeceras/UX
};

const KEY = "axioma.session";

/* ------------------------- Persistencia en localStorage ------------------------- */
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

/* ---------------------------------- Hook React --------------------------------- */
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
        ready: true, // listo para que Home redirija a /login sin parpadeo
        name: "",
      },
    [session]
  );
}

/* --------------------------------- Helpers rol --------------------------------- */

// Útil para checks ad-hoc
export function hasRole(s: Session, roles: UserRole[] = []): boolean {
  return roles.includes(s.role);
}

// SUPERADMIN: rol superior, control total del sistema / CPanel global
export function isSuperAdmin(s: Session): boolean {
  return s.role === "SUPERADMIN";
}

// Admin de NEGOCIO (no global): OWNER o ADMIN
// Importante: NO incluye SUPERADMIN para evitar confusiones en vistas de negocio.
export function isAdmin(s: Session): boolean {
  return s.role === "OWNER" || s.role === "ADMIN";
}

// Staff del negoci
