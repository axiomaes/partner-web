// partner-web/src/shared/auth.ts
import { useEffect, useMemo, useState } from "react";

export type UserRole = "SUPERADMIN" | "OWNER" | "ADMIN" | "BARBER";
export type Session = { email: string; role: UserRole; token: string; ready: boolean };

const KEY = "axioma.session";

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    // Validación mínima
    if (!s || typeof s !== "object" || typeof s.token !== "string") throw new Error("bad session");
    return {
      email: String(s.email || ""),
      role: (String(s.role || "").toUpperCase() as UserRole) || "BARBER",
      token: String(s.token),
      ready: !!s.ready,
    };
  } catch {
    // Si está corrupto, lo limpiamos para evitar crash en el render
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

export function useSession(): Session & { email?: string } {
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
        ready: true, // listo para que Home redirija a /login sin parpadeo
      } as Session),
    [session]
  );
}
