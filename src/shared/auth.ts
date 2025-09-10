// src/shared/auth.ts
import { useEffect, useMemo, useState } from "react";

/* ===== Tipos ===== */
export type UserRole = "SUPERADMIN" | "OWNER" | "ADMIN" | "BARBER";

export type Session = {
  email: string;
  role: UserRole;
  token: string;
  ready: boolean;
  name?: string;
  businessId?: string | null;
};

type RoleLike = Session | UserRole;
const KEY = "axioma.session";
const ROLE_SET = new Set(["SUPERADMIN","OWNER","ADMIN","BARBER"]);

/* ===== Utils ===== */
function looksLikeJwt(t?: unknown) {
  return typeof t === "string" && t.split(".").length === 3 && t.length > 20;
}
function normRole(r: unknown): UserRole {
  const v = String(r || "").toUpperCase();
  return (ROLE_SET.has(v) ? (v as UserRole) : "BARBER");
}

/* ===== Persistencia + hardening ===== */
export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);

    // Validaciones duras
    const token = String(s?.token ?? "");
    const role  = normRole(s?.role);
    const email = String(s?.email ?? "");

    if (!looksLikeJwt(token)) throw new Error("invalid token");
    if (!ROLE_SET.has(role)) throw new Error("invalid role");

    return {
      email,
      role,
      token,
      ready: !!s?.ready,
      name: s?.name ? String(s.name) : undefined,
      businessId: s?.businessId ?? null,
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

/* ===== Hook de sesión ===== */
export function useSession(): Session {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => { setSession(loadSession()); }, []);
  return useMemo(
    () =>
      session ?? ({
        email: "",
        role: "BARBER",
        token: "",
        ready: true,       // evita parpadeos
        name: "",
        businessId: null,
      } as Session),
    [session]
  );
}

/* ===== Helpers de rol/permiso ===== */
function getRole(x: RoleLike): UserRole {
  return (typeof x === "string" ? x.toUpperCase() : x.role) as UserRole;
}

export const isSuperAdmin = (who: RoleLike) => getRole(who) === "SUPERADMIN";
export const isOwner      = (who: RoleLike) => getRole(who) === "OWNER";
export const isBarber     = (who: RoleLike) => getRole(who) === "BARBER";
/** ADMIN de negocio = ADMIN u OWNER */
export const isAdmin      = (who: RoleLike) => {
  const r = getRole(who);
  return r === "ADMIN" || r === "OWNER";
};
export const isStaff      = (who: RoleLike) => {
  const r = getRole(who);
  return r === "OWNER" || r === "ADMIN" || r === "BARBER";
};
export const hasRole = (who: RoleLike, roles: UserRole[]) => roles.includes(getRole(who));
export const canActOnBusiness = (s: Session, businessId?: string | null) =>
  isSuperAdmin(s) || (!!s.businessId && !!businessId && s.businessId === businessId);
