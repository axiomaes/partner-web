// partner-web/src/shared/auth.ts
import { useEffect, useState } from "react";
import { api } from "@/shared/api";

export type Role = "BARBER" | "ADMIN" | "OWNER" | "SUPERADMIN";
export type Session = {
  id?: string;
  name?: string;
  email?: string;
  role?: Role;
  token?: string;
  ready: boolean;
};

const STORAGE_KEY = "axioma.session";

function safeParse<T = any>(s: string | null): T | null {
  try { return s ? JSON.parse(s) as T : null; } catch { return null; }
}

export function loadSession(): Session {
  return safeParse<Session>(localStorage.getItem(STORAGE_KEY)) ?? { ready: true };
}

export function saveSession(s: Session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function decodeJwt<T = any>(token?: string): T | null {
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json))) as T;
  } catch {
    return null;
  }
}

/**
 * Login que NO depende de /auth/me. Decodifica el JWT para obtener email/role.
 * Si /auth/me existe, lo usa solo para enriquecer (ignora 404).
 */
export async function login(email: string, password: string): Promise<Session> {
  const { data } = await api.post("/auth/login", { email, password });
  const token: string | undefined = data?.access_token ?? data?.token;
  if (!token) throw new Error("No se recibió access_token");

  const p = decodeJwt<any>(token) || {};
  const role: Role | undefined =
    p.role ??
    (Array.isArray(p.roles) ? p.roles[0] : undefined) ??
    (p.isSuperadmin ? "SUPERADMIN" : undefined);

  // Sesión mínima desde el JWT
  let session: Session = {
    id: p.sub || p.id,
    name: p.name,
    email: p.email || email,
    role,
    token,
    ready: true,
  };
  saveSession(session);

  // Enriquecer con /auth/me si existe (ignora 404)
  try {
    const me = await api.get("/auth/me");
    if (me?.data) {
      session = { ...session, ...me.data };
      saveSession(session);
    }
  } catch (e: any) {
    if (e?.response?.status !== 404) {
      // otros errores de red están bien loguearlos
      console.warn("auth/me falló (no bloquea):", e?.response?.status || e?.message);
    }
  }

  return session;
}

export function useSession(): Session {
  const [s, setS] = useState<Session>(() => loadSession());
  useEffect(() => {
    // Suscripción simple a cambios del storage (por si abres varias pestañas)
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === STORAGE_KEY) setS(loadSession());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return s;
}

export function isAdmin(role?: string | null): boolean {
  return role === "ADMIN" || role === "OWNER" || role === "SUPERADMIN";
}
