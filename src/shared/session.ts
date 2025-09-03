// Manejo de sesión en frontend
export type SessionUser = {
  id: string;
  name?: string;
  email?: string;
  role: string; // 'ADMIN' | 'BARBER' | 'OWNER' | 'SUPERADMIN' | ...
};

const USER_KEY = "axioma:me";
const TOKEN_KEY = "accessToken";

export function saveSession(user: SessionUser, token?: string) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

export function readSession(): SessionUser | null {
  const raw =
    localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}
