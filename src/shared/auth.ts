// web/src/shared/auth.ts
export type UserRole = "ADMIN" | "BARBER";
export type User = { id: string; email: string; role: UserRole };
export type AuthState = { token: string; user: User };

const KEY = "axioma_auth";

export function saveAuth(token: string, user: User) {
  localStorage.setItem(KEY, JSON.stringify({ token, user }));
}

export function loadAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}

export function getToken(): string | null {
  return loadAuth()?.token ?? null;
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function hasRole(role: UserRole | UserRole[]): boolean {
  const auth = loadAuth();
  if (!auth) return false;
  const wanted = Array.isArray(role) ? role : [role];
  return wanted.includes(auth.user.role);
}
