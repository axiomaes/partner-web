// claves únicas para toda la app
const TOKEN_KEY = "axioma:token";
const USER_KEY  = "axioma:user";

export type SessionUser = {
  id: string;
  email: string;
  name?: string;
  role?: string;
  businessId?: string;
};

export function saveSession(user: SessionUser, token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): SessionUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
