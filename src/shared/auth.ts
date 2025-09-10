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
      ready: !!s.ready,
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
  localStorage.setItem(KEY, JSON.stringify({
    email: s.email,
    role: s.role,
    token: s.token,
    ready: !!s.ready,
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
  useEffect(() => { setSession(loadSession()); }, []);
  return useMemo(
    () =>
      session ?? {
        email: "",
        role: "BARBER",
        token: "",
        ready: true,
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
  // si es objeto con role
  if (subject && typeof subject === "object" && "role" in subject) {
    const role = (subject as any).role;
    return normRoleMaybe(role) ?? "BARBER";
  }
  // si es string/crudo
  return normRoleMaybe(String(subject)) ?? "BARBER";
}

/** Devuelve true si el sujeto (objeto o string) está en alguno de los roles dados */
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

/* Helpers de compatibilidad (hay imports antiguos en el código) */
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
