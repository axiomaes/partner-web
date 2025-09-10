// src/shared/auth.ts
import { useEffect, useMemo, useState } from "react";

/* ===== Tipos ===== */
export type UserRole = "SUPERADMIN" | "OWNER" | "ADMIN" | "BARBER";

export type Session = {
  email: string;
  role: UserRole;
  token: string;
  ready: boolean;
  /** Nombre visible del usuario o negocio (opcional, para UI) */
  name?: string;
  /** Negocio al que pertenece el staff; null/undefined para SUPERADMIN */
  businessId?: string | null;
};

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

  useEffect(() => {
    setSession(loadSession());
  }, []);

  // Nunca devolvemos algo que rompa la UI
  return useMemo(
    () =>
      session ?? ({
        email: "",
        role: "BARBER",
        token: "",
        ready: true,        // listo para que Home/guards no parpadeen
        name: "",
        businessId: null,
      } as Session),
    [session]
  );
}

/* ===== Helpers de rol/permiso ===== */
export const isSuperAdmin = (s: Session) => s.role === "SUPERADMIN";
export const isOwner      = (s: Session) => s.role === "OWNER";
export const isBarber     = (s: Session) => s.role === "BARBER";

/**
 * isAdmin: “admin de negocio”.
 * Consideramos ADMIN y OWNER como administradores de su negocio.
 */
export const isAdmin      = (s: Session) => s.role === "ADMIN" || s.role === "OWNER";

/** Cualquier staff (no superadmin) */
export const isStaff      = (s: Session) => s.role === "OWNER" || s.role === "ADMIN" || s.role === "BARBER";

/** Chequea si el rol actual está en la lista permitida */
export const hasRole = (s: Session, roles: UserRole[]) => roles.includes(s.role);

/** Puede actuar sobre un negocio dado (superadmin o staff del mismo negocio) */
export const canActOnBusiness = (s: Session, businessId?: string | null) =>
  isSuperAdmin(s) || (!!s.businessId && !!businessId && s.businessId === businessId);
