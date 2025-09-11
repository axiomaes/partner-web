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
      // sesión válida → lista
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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSession(loadSession());
    setHydrated(true); // ← importante: ya hidratamos (tengas o no token)
  }, []);

  // Si hay sesión válida, úsala. Si no, devolvemos una sesión “vacía”
  // con ready=true una vez hidratado, para que el router pueda mostrar /login.
  return useMemo<Session>(
    () =>
      session ?? {
        email: "",
        role: "BARBER",
        token: "",
        ready: hydrated, // false antes de hidratar; true después, aunque no haya token
      },
    [session, hydrated]
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
