// partner-web/src/shared/session.ts
export type Session = {
  token: string;
  payload: {
    businessId: string;
    email?: string;
    role?: string;
    [k: string]: unknown;
  };
};

export function loadSession(): Session | null {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const base64 = (token.split(".")[1] || "").replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(base64));
    return { token, payload: { businessId: json.businessId, email: json.email, role: json.role, ...json } };
  } catch {
    return null;
  }
}

export function saveToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearSession() {
  localStorage.removeItem("token");
}
