// src/shared/auth.ts
export type UserRole = "ADMIN" | "BARBER" | "OWNER" | "SUPERADMIN";

export type SessionUser = {
  id: string;
  name?: string;
  email: string;
  role: UserRole;
};

export type Session = {
  user: SessionUser;
  token: string;
};

const KEY = "axioma_session";

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(user: SessionUser, token: string) {
  const s: Session = { user, token };
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export function getToken(): string | null {
  return loadSession()?.token ?? null;
}

// Helpers de rol
export function isAdmin(role?: string | null): boolean {
  const r = String(role ?? "").toUpperCase();
  return r === "ADMIN" || r === "OWNER" || r === "SUPERADMIN";
}

import { useEffect, useMemo, useState } from "react";

export function useSession() {
  // Hidratación SINCRÓNICA para evitar parpadeo
  const initial = useMemo(() => loadSession(), []);
  const [session, setSession] = useState<Session | null>(initial);

  // Sync entre pestañas
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setSession(loadSession());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return {
    id: session?.user.id,
    name: session?.user.name,
    email: session?.user.email,
    role: session?.user.role,
    token: session?.token,
    // `ready` siempre true porque hidratamos sincrónicamente
    ready: true,
  };
}
