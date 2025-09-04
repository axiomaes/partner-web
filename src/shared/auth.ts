// partner-web/src/shared/auth.ts
import { useEffect, useState } from "react";

export type UserRole = "ADMIN" | "BARBER" | "OWNER" | "SUPERADMIN";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type SessionShape = { user: SessionUser; token: string };

const SESSION_KEY = "axioma_session";

/** Guarda sesión (panel staff/admin) */
export function saveSession(user: SessionUser, token: string) {
  const data: SessionShape = { user, token };
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

/** Borra la sesión completa */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/** Devuelve el token del panel o null */
export function getToken(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionShape;
    return parsed?.token || null;
  } catch {
    return null;
  }
}

/** Devuelve el usuario en sesión o null */
export function getUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionShape;
    return parsed?.user || null;
  } catch {
    return null;
  }
}

/** Hook sencillo para leer la sesión y reaccionar a cambios entre pestañas */
export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(() => getUser());
  const [token, setToken] = useState<string | null>(() => getToken());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key !== SESSION_KEY) return;
      setUser(getUser());
      setToken(getToken());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return {
    ...((user || {}) as SessionUser),
    token,
    isAuth: !!token,
    user,
  };
}

export function isAdmin(role?: UserRole | string | null) {
  return ["ADMIN", "OWNER", "SUPERADMIN"].includes(String(role || ""));
}
