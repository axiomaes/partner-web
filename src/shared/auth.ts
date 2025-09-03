// web/src/shared/auth.ts

export type UserRole = "ADMIN" | "BARBER" | "OWNER" | "SUPERADMIN";
export type User = { id: string; email: string; role: UserRole };
export type AuthState = { token: string; user: User };

const KEY = "axioma_auth";

// 👇 Roles con privilegios de administración
export const ADMIN_ROLES: UserRole[] = ["ADMIN", "OWNER", "SUPERADMIN"];

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

/**
 * Comprueba si el rol del usuario satisface alguno de los roles requeridos.
 * - Si se pide "ADMIN", aceptamos ADMIN/OWNER/SUPERADMIN.
 * - Si se pide "BARBER", aceptamos BARBER y también los ADMIN_ROLES (admins ven todo).
 */
export function hasRole(role: UserRole | UserRole[]): boolean {
  const auth = loadAuth();
  if (!auth) return false;

  const userRole = auth.user.role;
  const wanted = Array.isArray(role) ? role : [role];

  const roleSatisfies = (need: UserRole) => {
    if (need === "ADMIN") return ADMIN_ROLES.includes(userRole);
    if (need === "BARBER") return userRole === "BARBER" || ADMIN_ROLES.includes(userRole);
    // Para otros roles futuros, igualdad exacta:
    return userRole === need;
  };

  return wanted.some(roleSatisfies);
}

/* === Decodificar payload del JWT (para businessId, etc.) === */
export function getJwtPayload(): Record<string, unknown> | null {
  const token = getToken();
  if (!token) return null;
  try {
    const b64 = (token.split(".")[1] || "").replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(b64);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getBusinessId(): string | null {
  const p = getJwtPayload();
  const id = (p?.["businessId"] as string) || null;
  return id && typeof id === "string" ? id : null;
}

/* === Hook/ayuda de sesión para páginas === */
export function useSession() {
  const auth = loadAuth();
  return {
    token: auth?.token ?? null,
    role: (auth?.user.role ?? "BARBER") as UserRole,
    businessId: getBusinessId() || "",
    email: auth?.user.email ?? "",
  };
}

/** Admin “ampliado”: true para ADMIN, OWNER y SUPERADMIN */
export function isAdmin(role?: UserRole | null) {
  return !!role && ADMIN_ROLES.includes(role);
}
