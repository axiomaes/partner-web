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

/* --------------------------- Normalización de entrada --------------------------- */
/**
 * Los guards aceptan:
 * - Session completa
 * - Cualquier objeto con { role?: string }
 * - Un string directo con el rol
 */
export type GuardInput =
  | Session
  | { role?: string | UserRole }
  | string
  | null
  | undefined;

function normalizeRole(input: GuardInput): UserRole {
  const raw =
    typeof input === "string"
      ? input
      : input && typeof input === "object"
      ? // @ts-expect-error — leer role si existe
        (input.role as string | undefined)
      : undefined;

  const up = String(raw || "").toUpperCase();
  if (up === "SUPERADMIN" || up === "OWNER" || up === "ADMIN" || up === "BARBER") {
    return up as UserRole;
  }
  // Valor por defecto conservador
  return "BARBER";
}

/* --------------------------------- Helpers rol --------------------------------- */

// Útil para checks ad-hoc con input flexible
export function hasRole(input: GuardInput, roles: UserRole[] = []): boolean {
  return roles.includes(normalizeRole(input));
}

// SUPERADMIN: rol superior, control total del sistema / CPanel global
export function isSuperAdmin(input: GuardInput): boolean {
  return normalizeRole(input) === "SUPERADMIN";
}

// Admin de NEGOCIO (no global): OWNER o ADMIN
// Importante: NO incluye SUPERADMIN para evitar confusiones en vistas de negocio.
export function isAdmin(input: GuardInput): boolean {
  const r = normalizeRole(input);
  return r === "OWNER" || r === "ADMIN";
}

// Staff del negocio (toda la operativa diaria)
export function isBusinessStaff(input: GuardInput): boolean {
  const r = normalizeRole(input);
  return r === "OWNER" || r === "ADMIN" || r === "BARBER";
}

// Roles atómicos (por comodidad)
export function isOwner(input: GuardInput): boolean { return normalizeRole(input) === "OWNER"; }
export function isBarber(input: GuardInput): boolean { return normalizeRole(input) === "BARBER"; }

/* ------------------------------- Helpers de ruta ------------------------------- */
export function canAccessCPanel(input: GuardInput): boolean {
  return isSuperAdmin(input);
}

export function canAccessBusinessPanel(input: GuardInput): boolean {
  return isBusinessStaff(input);
}

/* ---------------------------------- Helpers UX --------------------------------- */
export function displayName(s: Session): string {
  return s.name || s.email || "Usuario";
}
