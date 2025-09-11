// src/shared/auth.ts
import { useEffect, useMemo, useState } from "react";

/* Tipos */
export type UserRole = "SUPERADMIN" | "OWNER" | "ADMIN" | "BARBER";

export type Session = {
  email: string;
  role: UserRole;
  token: string;
  ready: boolean;
  name?: string;
  businessId?: string | null;
};

/* Storage */
const KEY = "axioma.session";

/* ===== Utilidades JWT (sin dependencias) ===== */
function parseJwt<T = any>(token: string): T | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    try {
      // Manejo de UTF-8 si hiciera falta
      return JSON.parse(decodeURIComponent(escape(json))) as T;
    } catch {
      return JSON.parse(json) as T;
    }
  } catch {
    return null;
  }
}

function isExpired(token: string): boolean {
  const p = parseJwt<{ exp?: number }>(token);
  if (!p?.exp) return false; // si no hay exp, asumimos no expirado (tu API la incluye)
  const now = Math.floor(Date.now() / 1000);
  return p.exp <= now;
}

/* ===== Roles ===== */
const VALID = new Set<UserRole>(["SUPERADMIN", "OWNER", "ADMIN", "BARBER"]);
function normRoleMaybe(r: unknown): UserRole | null {
  if (typeof r !== "string") return null;
  const up = r.toUpperCase();
  return VALID.has(up as UserRole) ? (up as UserRole) : null;
}

/* ===== Sesión ===== */
export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s !== "object") throw new Error("bad session");

    const token = String(s.token || "");
    if (!token) throw new Error("missing token");

    // 🔒 Si el token está vencido o corrupto, eliminamos y devolvemos null
    if (!token || isExpired(token)) {
      try { localStorage.removeItem(KEY); } catch {}
      return null;
    }

    const role =
      normRoleMaybe(s.role) ??
      // Fallback por compatibilidad: intenta leer del JWT si no guardamos role
      (normRoleMaybe((parseJwt<{ role?: string }>(token)?.role ?? "").toString()) ??
        "BARBER");

    const safe: Session = {
      email: String(s.email || ""),
      role,
      token,
      ready: true, // ya validamos el token
      name: s.name ? String(s.name) : undefined,
      businessId:
        s.businessId === undefined || s.businessId === null
          ? null
          : String(s.businessId),
    };
    return safe;
  } catch {
    try { localStorage.removeItem(KEY); } catch {}
    return null;
  }
}

export function saveSession(s: Session) {
  // Guardamos siempre ready:true tras login correcto
  localStorage.setItem(KEY, JSON.stringify({
    email: s.email,
    role: s.role,
    token: s.token,
    ready: true,
    name: s.name,
    businessId: s.businessId ?? null,
  }));
}

export function clearSession() {
  try { localStorage.removeItem(KEY); } catch {}
}

/* Hook */
export function useSession(): Session {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    setSession(loadSession());
  }, []);

  // Mientras hidrata desde localStorage, evitamos decidir rutas
  return useMemo(
    () =>
      session ?? {
        email: "",
        role: "BARBER",
        token: "",
        ready: false, // clave para evitar “parpadeo”
      },
    [session]
  );
}

/* ===== Helpers de rol tolerantes (aceptan objeto o string) ===== */
function resolveRole(subject: Pick<Session, "role"> | UserRole | string): UserRole {
  if (subject && typeof subject === "object" && "role" in subject) {
    const role = (subject as any).role;
    return normRoleMaybe(role) ?? "BARBER";
  }
  return normRoleMaybe(String(subject)) ?? "BARBER";
}

export function hasRole(
  subject: Pick<Session, "role"> | UserRole | string,
  roles: UserRole[]
): boolean {
  const r = resolveRole(subject);
  return roles.includes(r);
}

export function isSuperAdmin(subject: Pick<Session, "role"> | UserRole | string): boolean {
  return resolveRole(subject) === "SUPERADMIN";
}

export function isAdmin(subject: Pick<Session, "role"> | UserRole | string): boolean {
  const r = resolveRole(subject);
  return r === "ADMIN" || r === "OWNER" || r === "SUPERADMIN";
}
export function isOwner(subject: Pick<Session, "role"> | UserRole | string): boolean {
  return resolveRole(subject) === "OWNER";
}
export function isBarber(subject: Pick<Session, "role"> | UserRole | string): boolean {
  return resolveRole(subject) === "BARBER";
}
