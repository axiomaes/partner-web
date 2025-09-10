// partner-web/src/shared/auth.ts
import { useEffect, useMemo, useState } from "react";

export type UserRole = "SUPERADMIN" | "OWNER" | "ADMIN" | "BARBER";

export type Session = {
  email: string;
  role: UserRole;
  token: string;
  ready: boolean;
  name?: string; // opcional, usado en algunos layouts
};

const KEY = "axioma.session";

// ---- Persistencia ----
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
    try {
      localStorage.removeItem(KEY);
    } catch {}
    return null;
  }
}

export function saveSession(s: Session) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

// ---- React hook ----
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
        ready: true,
        name: "",
      },
    [session]
  );
}

// ---- Helpers de roles ----
export function isAdmin(session: Session): boolean {
  return session.role === "ADMIN" || session.role === "OWNER" || session.role === "SUPERADMIN";
}

export function isSuperAdmin(session: Session): boolean {
  return session.role === "SUPERADMIN";
}

export function isOwner(session: Session): boolean {
  return session.role === "OWNER";
}

export function isBarber(session: Session): boolean {
  return session.role === "BARBER";
}
