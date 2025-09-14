import axios, { AxiosHeaders, AxiosInstance } from "axios";
import { saveSession } from "./auth";

/** ===== Tipos compartidos ===== */
export type UserRole = "SUPERADMIN" | "OWNER" | "ADMIN" | "BARBER";
export type SessionLike = {
  email: string;
  role: UserRole;
  token: string;
  ready: boolean;
  name?: string;
  businessId?: string | null;
};

/** ================= Base URL ================== */
const PROD_API = "https://axioma-api.stacks.axioma-creativa.es";

function computeBaseURL(): string {
  const viteEnv = (import.meta as any)?.env?.VITE_API_BASE;
  if (viteEnv && typeof viteEnv === "string" && viteEnv.trim() !== "") return viteEnv;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.endsWith(".axioma-creativa.es")) return PROD_API;
  }
  return "http://localhost:3000";
}
export const baseURL = computeBaseURL();

/** ============= Helpers de auth (solo storage) ============= */
const PANEL_STORAGE_KEY = "axioma.session";
const PORTAL_KEY = "axioma_portal";

function getTokenFromStorage(): string | null {
  try {
    const raw = localStorage.getItem(PANEL_STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return typeof s?.token === "string" && s.token.trim() ? s.token : null;
  } catch {
    return null;
  }
}
function clearPanelSession() {
  try { localStorage.removeItem(PANEL_STORAGE_KEY); } catch {}
}

export type PortalSession = { token: string; customerId?: string; businessId?: string };
export function loadPortalSession(): PortalSession | null {
  try { const raw = localStorage.getItem(PORTAL_KEY); return raw ? (JSON.parse(raw) as PortalSession) : null; }
  catch { return null; }
}
export function savePortalSession(s: PortalSession) { localStorage.setItem(PORTAL_KEY, JSON.stringify(s)); }
export function clearPortalSession() { localStorage.removeItem(PORTAL_KEY); }

/** ============= JWT helpers (ligeros) ============= */
function parseJwt<T = any>(token: string): T | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json))) as T;
  } catch { return null; }
}
function isExpired(token: string): boolean {
  const p = parseJwt<{ exp?: number }>(token);
  if (!p?.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return p.exp <= now;
}
function roleFromToken(token: string): UserRole | null {
  const p = parseJwt<{ role?: string }>(token);
  const r = String(p?.role || "").toUpperCase();
  return (["SUPERADMIN","OWNER","ADMIN","BARBER"] as const).includes(r as UserRole) ? (r as UserRole) : null;
}
function businessFromToken(token: string): string | null {
  const p = parseJwt<{ businessId?: string }>(token);
  return p?.businessId ? String(p.businessId) : null;
}

/** ============= Rutas post-login por rol ============= */
export function postLoginPathByRole(role: UserRole): string {
  switch (role) {
    case "SUPERADMIN": return "/cpanel";
    case "OWNER":
    case "ADMIN":
    case "BARBER":
    default:
      return "/app";
  }
}

/** ============= Axios panel (staff/admin) ============= */
export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const url = String(config.url || "");
  let path = url;
  try { path = new URL(url, baseURL).pathname; } catch {}
  const headers = AxiosHeaders.from(config.headers || {});
  if (path !== "/auth/login") {
    const token = getTokenFromStorage();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  config.headers = headers;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status as number | undefined;
    const method = String(err?.config?.method || "GET").toUpperCase();
    const cfgUrl = String(err?.config?.url || "");
    let path = cfgUrl;
    try { path = new URL(cfgUrl, baseURL).pathname; } catch {}
    const isCpanel = path.startsWith("/cp/");
    const isAuthLogin = path === "/auth/login";

    if ((status === 401 || status === 403) && !isCpanel && !isAuthLogin && method !== "OPTIONS") {
      clearPanelSession();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }
    return Promise.reject(err);
  }
);

/** ============= Axios portal (OTP clientes) ============= */
export const portalApi: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});
portalApi.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers || {});
  const p = loadPortalSession();
  if (p?.token) headers.set("Authorization", `Bearer ${p.token}`);
  config.headers = headers;
  return config;
});

/** ============= Login staff centralizado ============= */
export async function authLogin(email: string, password: string) {
  const r = await api.post("/auth/login", { email, password }, { validateStatus: () => true });
  if (r.status < 200 || r.status >= 300) {
    const msg = r.data?.message || r.data?.error || "No autorizado";
    throw new Error(msg);
  }
  const token: string = r.data?.access_token || r.data?.token;
  if (!token) throw new Error("Token ausente en la respuesta");
  if (isExpired(token)) throw new Error("Sesión caducada. Inicia sesión de nuevo.");

  const role = (r.data?.role as UserRole) || roleFromToken(token) || "BARBER";
  const businessId = r.data?.businessId ?? businessFromToken(token) ?? null;

  const session: SessionLike = {
    email: r.data?.email || email,
    role,
    token,
    ready: true,
    name: r.data?.name,
    businessId,
  };
  saveSession(session as any);

  const next = postLoginPathByRole(role);
  return { session, next };
}

/* ===========================================================
   ===============  CPANEL: negocios (CP)  ====================
   Exportamos CpBusiness y listCpBusinesses para compatibilidad
   con src/lib/api.ts
   ===========================================================*/
export type CpBusiness = { id: string; name?: string; displayName?: string };

const CP_BIZ_ENDPOINTS = [
  "/cp/admin/businesses",
  "/cp/businesses",
  "/cp/admin/businesses/list",
  "/admin/businesses",
  "/businesses",
];

export async function listCpBusinesses(): Promise<CpBusiness[]> {
  let lastErr: any = null;
  for (const path of CP_BIZ_ENDPOINTS) {
    try {
      const r = await api.get(path, { validateStatus: () => true });
      if (r.status >= 200 && r.status < 300) {
        const items = (Array.isArray(r.data) ? r.data : r.data?.items ?? r.data?.data ?? []) as CpBusiness[];
        if (items) return items;
      }
      if (r.status !== 404) lastErr = new Error(r.data?.message || `HTTP ${r.status} en ${path}`);
    } catch (e) {
      lastErr = e;
    }
  }
  if (lastErr) throw lastErr;
  throw new Error("No existe endpoint CP para listar negocios.");
}

/** ============= Tipos/Helpers panel ============= */
export type UserLite = {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: UserRole;
  active?: boolean;
};

export type CustomerLite = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  businessId?: string;
};

type CreatedCustomer = { id: string; name: string; existed?: boolean };

/** ====== Usuarios ====== */
export async function listUsers(q?: string): Promise<UserLite[]> {
  const r = await api.get("/users", { params: q ? { q } : undefined, validateStatus: () => true });
  if (r.status >= 200 && r.status < 300) {
    const data = r.data;
    return (Array.isArray(data) ? data : data?.rows ?? data?.items ?? data?.data ?? []) as UserLite[];
  }
  throw new Error(r.data?.message || `HTTP ${r.status}`);
}

export const createUser = (email: string, password: string, role: UserRole) =>
  api.post("/users", { email, password, role }).then((r) => r.data as UserLite);

export async function updateUser(
  userId: string,
  patch: Partial<Pick<UserLite, "name" | "role" | "active">>
): Promise<UserLite> {
  const r = await api.patch(`/users/${encodeURIComponent(userId)}`, patch, { validateStatus: () => true });
  if (r.status >= 200 && r.status < 300) return r.data as UserLite;
  throw new Error(r.data?.message || `HTTP ${r.status}`);
}

// === RESET PASSWORD (otro usuario) con “fallback” de rutas ===
export async function resetUserPassword(userId: string): Promise<{ tempPassword: string }> {
  type Cand = {
    method: "POST" | "PATCH";
    url: (id: string) => string;
    body?: (id: string) => any;
    // si el backend envía un 2xx sin devolver password, asumimos que la envían por email
    assumeOkWithoutBody?: boolean;
  };

  const CANDIDATES: Cand[] = [
    // 1) La más común: por id
    { method: "POST", url: (id) => `/users/${encodeURIComponent(id)}/reset-password` },

    // 2) Variantes admin/CP
    { method: "POST", url: (id) => `/admin/users/${encodeURIComponent(id)}/reset-password` },
    { method: "POST", url: (id) => `/cp/users/${encodeURIComponent(id)}/reset-password` },

    // 3) PATCH directo de contraseña (el backend genera una temp o la fija y la devuelve)
    { method: "PATCH", url: (id) => `/users/${encodeURIComponent(id)}/password`, body: () => ({ newPassword: "__GENERATE__" }) },

    // 4) Ruta sin id que recibe { userId }
    { method: "POST", url: () => `/users/reset-password`, body: (id) => ({ userId: id }) },
  ];

  let lastMsg = "";
  for (const c of CANDIDATES) {
    try {
      const r = await api.request({
        method: c.method,
        url: c.url(userId),
        data: c.body ? c.body(userId) : undefined,
        validateStatus: () => true,
      });

      if (r.status >= 200 && r.status < 300) {
        // distintos backends devuelven nombres distintos
        const tmp =
          r.data?.tempPassword ??
          r.data?.password ??
          r.data?.newPassword ??
          r.data?.temp ??
          "";

        if (typeof tmp === "string" && tmp.trim().length > 0) {
          return { tempPassword: tmp };
        }

        // éxito sin password en cuerpo ⇒ probablemente enviada por correo
        return { tempPassword: "" };
      }

      // guarda el último mensaje por si necesitamos mostrarlo
      lastMsg = (r.data?.message || r.data?.error || `HTTP ${r.status} ${c.url(userId)}`).toString();
    } catch (e: any) {
      lastMsg = (e?.message || "Fallo de red").toString();
    }
  }

  // Mensaje amable, sin exponer el “Cannot POST …”
  throw new Error(
    "No encontré un endpoint compatible para resetear contraseña. " +
    "Activa en el backend una de estas rutas: " +
    "`POST /users/:id/reset-password`, `POST /admin/users/:id/reset-password`, " +
    "`PATCH /users/:id/password`, o `POST /users/reset-password`."
    + (lastMsg ? ` Detalle: ${lastMsg}` : "")
  );
}

/** 👇 Para compatibilidad con StaffNew.tsx */
export const createStaff = (email: string, password: string, role: "ADMIN" | "BARBER") =>
  api.post("/users", { email, password, role }).then((r) => r.data);

/** Cambiar mi contraseña (cuenta propia) con fallback de rutas */
const PASSWORD_CHANGE_CANDIDATES: Array<{ method: "PATCH" | "POST"; path: string }> = [
  { method: "PATCH", path: "/users/me/password" },
  { method: "POST",  path: "/users/me/password" },
  { method: "POST",  path: "/auth/change-password" },
  { method: "POST",  path: "/me/password" },
];
export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<true> {
  for (const cand of PASSWORD_CHANGE_CANDIDATES) {
    try {
      const r = await api.request({
        method: cand.method,
        url: cand.path,
        data: { currentPassword, newPassword },
        validateStatus: () => true,
      });
      if (r.status >= 200 && r.status < 300) return true;
    } catch {}
  }
  throw new Error("No se pudo cambiar la contraseña (endpoint no disponible).");
}

/** ====== Clientes ====== */
export async function listCustomers(params?: { q?: string; limit?: number }): Promise<CustomerLite[]> {
  const r = await api.get("/customers", {
    params: params?.q || params?.limit ? { q: params?.q, limit: params?.limit } : undefined,
    validateStatus: () => true,
  });
  if (r.status >= 200 && r.status < 300) {
    const d = r.data;
    const rows = Array.isArray(d) ? d : d.items ?? d.data ?? d.rows ?? [];
    return rows as CustomerLite[];
  }
  throw new Error(r.data?.message || `HTTP ${r.status}`);
}

export async function createCustomer(
  name: string,
  phone: string,
  birthday?: string
): Promise<{ id: string; name: string; existed?: boolean }> {
  const body: Record<string, any> = { name, phone };
  if (birthday && /^\d{4}-\d{2}-\d{2}$/.test(birthday)) body.birthday = birthday;
  const r = await api.post("/customers", body);
  return r.data;
}

export async function getCustomer(id: string): Promise<CustomerLite | null> {
  try {
    const r = await api.get(`/customers/${encodeURIComponent(id)}`, { validateStatus: () => true });
    if (r.status >= 200 && r.status < 300 && r.data) return r.data as CustomerLite;
  } catch {}
  try {
    const all = await listCustomers();
    const hit = (all as any[]).find((c) => c.id === id) ?? null;
    return hit as CustomerLite | null;
  } catch { return null; }
}

export async function deleteCustomer(id: string): Promise<void> {
  const r = await api.delete(`/customers/${encodeURIComponent(id)}`, { validateStatus: () => true });
  if (r.status >= 200 && r.status < 300) return;
  const err: any = new Error(
    r.status === 403
      ? "No tienes permiso para eliminar este cliente (se requiere ADMIN u OWNER)."
      : r.data?.message || `Fallo al eliminar (HTTP ${r.status}).`
  );
  err.status = r.status;
  throw err;
}

/** ===== Visitas / QR ===== */
export async function addVisit(customerId: string, notes?: string) {
  const candidates = [
    `/customers/${encodeURIComponent(customerId)}/visits`,
    `/app/customers/${encodeURIComponent(customerId)}/visits`,
    `/visits`, // body con customerId
  ];
  for (const p of candidates) {
    try {
      const body = p === "/visits" ? { customerId, notes } : { notes };
      const r = await api.post(p, body, { validateStatus: () => true });
      if (r.status >= 200 && r.status < 300) return r.data;
    } catch {}
  }
  throw new Error("No se pudo registrar la visita.");
}

export async function getCustomerVisits(customerId: string) {
  const candidates = [
    `/customers/${encodeURIComponent(customerId)}/visits`,
    `/app/customers/${encodeURIComponent(customerId)}/visits`,
    `/visits?customerId=${encodeURIComponent(customerId)}`,
  ];
  for (const p of candidates) {
    try {
      const r = await api.get(p, { validateStatus: () => true });
      if (r.status >= 200 && r.status < 300) return r.data;
    } catch {}
  }
  return [];
}

export async function deleteCustomerVisit(customerId: string, visitId: string) {
  const candidates = [
    `/customers/${encodeURIComponent(customerId)}/visits/${encodeURIComponent(visitId)}`,
    `/app/customers/${encodeURIComponent(customerId)}/visits/${encodeURIComponent(visitId)}`,
  ];
  for (const p of candidates) {
    try {
      const r = await api.delete(p, { validateStatus: () => true });
      if (r.status >= 200 && r.status < 300) return true;
    } catch {}
  }
  throw new Error("No se pudo eliminar la visita.");
}

export const publicCustomerQrUrl = (customerId: string) =>
  `${baseURL}/public/customers/${encodeURIComponent(customerId)}/qr.png`;

export function resendCustomerQr(customerId: string) {
  return api.post(`/customers/${encodeURIComponent(customerId)}/qr/send`).then((r) => r.data);
}

/** ========= WhatsApp / OTP ========= */
export type WaStatus = {
  enabled?: boolean;
  from?: string | null;
  dailyLimit?: number | null;
  ratePerMinute?: number | null;
  monthlyCap?: number | null;
};

const WA_STATUS_CANDIDATES = ["/wa/status", "/whatsapp/status", "/integrations/wa/status", "/cp/wa/status"];
const WA_STATUS_CACHE_KEY = "axioma.wa.status_path";

async function resolvePath(candidates: string[], cacheKey: string): Promise<string | null> {
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached === "") return null;
    if (cached) return cached;
  } catch {}
  for (const p of candidates) {
    try {
      const r = await api.get(p, { validateStatus: () => true });
      if (r.status >= 200 && r.status < 300) {
        try { localStorage.setItem(cacheKey, p); } catch {}
        return p;
      }
    } catch {}
  }
  try { localStorage.setItem(cacheKey, ""); } catch {}
  return null;
}
export async function getWaStatus() {
  const path = await resolvePath(WA_STATUS_CANDIDATES, WA_STATUS_CACHE_KEY);
  if (!path) return null;
  const r = await api.get(path, { validateStatus: () => true });
  return r.status >= 200 && r.status < 300 ? r.data : null;
}

const OTP_REQUEST_CANDIDATES = ["/portal/otp/request", "/portal/otp/send", "/otp/request"];
const OTP_VERIFY_CANDIDATES  = ["/portal/otp/verify",  "/otp/verify"];
async function postFirstOk(pathList: string[], body: any) {
  let last: any = null;
  for (const p of pathList) {
    try {
      const r = await axios.post(baseURL + p, body, {
        headers: { "Content-Type": "application/json" },
        validateStatus: () => true,
      });
      if (r.status >= 200 && r.status < 300) return r;
      last = r;
    } catch (e) { last = e; }
  }
  const msg = last?.data?.message || last?.message || "No disponible";
  throw new Error(msg);
}
export async function requestCustomerOtp(body: { phone?: string; email?: string }) {
  await postFirstOk(OTP_REQUEST_CANDIDATES, body); return true;
}
export async function verifyCustomerOtp(body: { phone?: string; email?: string; code: string }) {
  const r = await postFirstOk(OTP_VERIFY_CANDIDATES, body); return r.data;
}
export async function getMyVisits() {
  const r = await portalApi.get("/portal/me/visits", { validateStatus: () => true });
  return r.status >= 200 && r.status < 300 ? (r.data as any[]) : [];
}
export async function getMyRewards() {
  const r = await portalApi.get("/portal/me/rewards", { validateStatus: () => true });
  return r.status >= 200 && r.status < 300 ? (r.data as any[]) : [];
}

/** Lee el payload del QR y registra una visita */
export function addVisitFromQrPayload(payload: string) {
  let parsed: any;
  try { parsed = JSON.parse(payload); }
  catch { throw new Error("QR inválido: no es JSON."); }
  if (!parsed || parsed.t !== "axioma-visit" || typeof parsed.customerId !== "string") {
    throw new Error("QR inválido: formato no reconocido.");
  }
  const notes = typeof parsed.notes === "string" ? parsed.notes : "Visita por QR";
  return addVisit(parsed.customerId, notes);
}

/** Lookup por teléfono/email */
type LookupInput = { phone?: string; email?: string };
export async function lookupCustomer(input: LookupInput) {
  const body: LookupInput = {};
  if (input.phone) body.phone = input.phone.trim();
  if (input.email) body.email = input.email.trim();

  try {
    const r = await api.post("/customers/lookup", body, { validateStatus: () => true });
    if (r.status >= 200 && r.status < 300 && r.data && r.data.id) return r.data as CustomerLite;
  } catch {}
  try {
    const list = await listCustomers();
    const phoneNorm = (body.phone || "").replace(/\D/g, "");
    const emailNorm = (body.email || "").toLowerCase();
    const found = (list as any[]).find((c) => {
      const cPhone = String(c.phone || "").replace(/\D/g, "");
      const cEmail = String(c.email || "").toLowerCase();
      return (phoneNorm && cPhone.endsWith(phoneNorm)) || (emailNorm && cEmail === emailNorm);
    });
    return (found as CustomerLite) || null;
  } catch { return null; }
}

export function addVisitByPhone(phone: string, notes?: string) {
  return api.post("/customers/visits/by-phone", { phone, notes }).then((r) => r.data);
}
