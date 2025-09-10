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

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s !== "object") throw new Error("bad session");

    const role = String(s.role || "").toUpperCase();
    const token = String(s.token || "");
    if (!token) throw new Error("missing token");

    const safe: Session = {
      email: String(s.email || ""),
      role: (["SUPERADMIN", "OWNER", "ADMIN", "BARBER"].includes(role)
        ? (role as UserRole)
        : "BARBER") as UserRole,
      token,
      // Importante: la sesión sólo se marca lista si es válida
      ready: true,
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
  // Forzamos ready=true al persistir una sesión válida tras login
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

  // Hasta que cargue desde localStorage, devolvemos ready:false para no redirigir
  return useMemo(
    () =>
      session ?? {
        email: "",
        role: "BARBER",
        token: "",
        ready: false, // ← clave para evitar el “flash”
      },
    [session]
  );
}

/* ===== Helpers de rol tolerantes (aceptan objeto o string) ===== */

const VALID = new Set<UserRole>(["SUPERADMIN","OWNER","ADMIN","BARBER"]);

function normRoleMaybe(r: unknown): UserRole | null {
  if (typeof r !== "string") return null;
  const up = r.toUpperCase();
  return (VALID.has(up as UserRole) ? (up as UserRole) : null);
}

function resolveRole(subject: Pick<Session,"role"> | UserRole | string): UserRole {
  if (subject && typeof subject === "object" && "role" in subject) {
    const role = (subject as any).role;
    return normRoleMaybe(role) ?? "BARBER";
  }
  return normRoleMaybe(String(subject)) ?? "BARBER";
}

export function hasRole(
  subject: Pick<Session,"role"> | UserRole | string,
  roles: UserRole[]
): boolean {
  const r = resolveRole(subject);
  return roles.includes(r);
}

export function isSuperAdmin(subject: Pick<Session,"role"> | UserRole | string): boolean {
  return resolveRole(subject) === "SUPERADMIN";
}

export function isAdmin(subject: Pick<Session,"role"> | UserRole | string): boolean {
  const r = resolveRole(subject);
  return r === "ADMIN" || r === "OWNER" || r === "SUPERADMIN";
}
export function isOwner(subject: Pick<Session,"role"> | UserRole | string): boolean {
  return resolveRole(subject) === "OWNER";
}
export function isBarber(subject: Pick<Session,"role"> | UserRole | string): boolean {
  return resolveRole(subject) === "BARBER";
}
