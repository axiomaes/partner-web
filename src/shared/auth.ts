import { useEffect, useMemo, useState } from "react";

export type UserRole = "SUPERADMIN" | "OWNER" | "ADMIN" | "BARBER";

export type Session = {
  email: string;
  role: UserRole;
  token: string;
  ready: boolean;
  businessId?: string | null; // null/undefined para SUPERADMIN
};

const KEY = "axioma.session";

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s !== "object" || typeof s.token !== "string") throw new Error("bad");
    return {
      email: String(s.email || ""),
      role: (String(s.role || "").toUpperCase() as UserRole) || "BARBER",
      token: String(s.token),
      ready: !!s.ready,
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
        businessId: null,
      } as Session),
    [session]
  );
}

/* Helpers */
export const isSuperAdmin = (s: Session) => s.role === "SUPERADMIN";
export const hasRole = (s: Session, roles: UserRole[]) => roles.includes(s.role);
export const canActOnBusiness = (s: Session, businessId?: string | null) =>
  isSuperAdmin(s) || (!!s.businessId && !!businessId && s.businessId === businessId);
