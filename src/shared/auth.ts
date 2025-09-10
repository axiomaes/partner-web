// src/shared/auth.ts
import { useEffect, useMemo, useState } from "react";

/* ===== Tipos ===== */
export type UserRole = "SUPERADMIN" | "OWNER" | "ADMIN" | "BARBER";

export type Session = {
  email: string;
  role: UserRole;
  token: string;
  ready: boolean;
  /** Nombre visible (opcional) */
  name?: string;
  /** Negocio del staff; null/undefined para SUPERADMIN */
  businessId?: string | null;
};

type RoleLike = Session | UserRole;

const KEY = "axioma.session";

/* ===== Persistencia ===== */
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
      businessId: s.businessId ?? null,
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
        ready: true,
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
/** Cualquier staff (no superadmin) */
export const isStaff      = (who: RoleLike) => {
  const r = getRole(who);
  return r === "OWNER" || r === "ADMIN" || r === "BARBER";
};
/** Chequea si el rol actual está en la lista permitida */
export const hasRole = (who: RoleLike, roles: UserRole[]) => roles.includes(getRole(who));

/** Puede actuar sobre un negocio dado (superadmin o staff del mismo negocio) */
export const canActOnBusiness = (s: Session, businessId?: string | null) =>
  isSuperAdmin(s) || (!!s.businessId && !!businessId && s.businessId === businessId);
