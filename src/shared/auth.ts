// src/shared/auth.ts
import { useEffect, useMemo, useState } from "react";

/* Tipos */
export type UserRole = "SUPERADMIN" | "OWNER" | "ADMIN" | "BARBER";

export type Session = {
  email: string;
  role: UserRole;
  token: string;
  ready: boolean;
  // opcionales (no rompen el tipo si no están)
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
      ready: !!s.ready, // importante
      name: s.name ? String(s.name) : undefined,
      businessId:
        s.businessId === undefined || s.businessId === null
          ? null
          : String(s.businessId),
    };
    return safe;
  } catch {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    return null;
  }
}

export function saveSession(s: Session) {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      email: s.email,
      role: s.role,
      token: s.token,
      ready: !!s.ready,
      name: s.name,
      businessId: s.businessId ?? null,
    })
  );
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

/* Hook */
export function useSession(): Session {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    setSession(loadSession());
  }, []);

  return useMemo(
    () =>
      session ?? {
        email: "",
        role: "BARBER",
        token: "",
        ready: true, // <- evita parpadeos mientras se hidrata
      },
    [session]
  );
}

/* Predicados de rol */
export function isSuperAdmin(s: Pick<Session, "role">): boolean {
  return s.role === "SUPERADMIN";
}
export function hasRole(s: Pick<Session, "role">, roles: UserRole[]): boolean {
  return roles.includes(s.role);
}

/* Helpers de compatibilidad (por si hay imports antiguos en el código) */
export function isAdmin(s: Pick<Session, "role">): boolean {
  return s.role === "ADMIN" || s.role === "OWNER" || s.role === "SUPERADMIN";
}
export function isOwner(s: Pick<Session, "role">): boolean {
  return s.role === "OWNER";
}
export function isBarber(s: Pick<Session, "role">): boolean {
  return s.role === "BARBER";
}
