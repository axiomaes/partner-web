// partner-web/src/shared/api.ts
import axios, { AxiosHeaders, AxiosInstance } from "axios";
import { getToken } from "./auth";
import type { UserRole } from "./auth";

/**
 * ===========================================
 *  Base URL (prod/dev) + axios instances
 * ===========================================
 */

const PROD_API = "https://axioma-api.stacks.axioma-creativa.es";

function stripTrailingSlashes(u: string) {
  return u.replace(/\/+$/, "");
}

function computeBaseURL(): string {
  const viteEnv = (import.meta as any)?.env?.VITE_API_BASE;
  if (viteEnv && typeof viteEnv === "string" && viteEnv.trim() !== "") {
    return stripTrailingSlashes(viteEnv);
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.endsWith(".axioma-creativa.es")) return PROD_API;
  }
  return "http://localhost:3000";
}

export const baseURL = computeBaseURL();

/** Instancia para STAFF/ADMIN (token de panel) */
export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers || {});
  const token = getToken();
  if (token && typeof token === "string" && token.trim() !== "") {
    headers.set("Authorization", `Bearer ${token}`);
  }
  config.headers = headers;
  return config;
});

// (Opcional) manejar 401 globalmente
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      // Si la sesión expiró, envía al login
      window.location.assign("/login");
    }
    return Promise.reject(err);
  }
);

/**
 * ===========================================
 *  Sesión del PORTAL (cliente final con OTP)
 * ===========================================
 * Guardamos un token distinto al del panel.
 */
const PORTAL_KEY = "axioma_portal";
export type PortalSession = { token: string; customerId?: string; businessId?: string };

export function loadPortalSession(): PortalSession | null {
  try {
    const raw = localStorage.getItem(PORTAL_KEY);
    return raw ? (JSON.parse(raw) as PortalSession) : null;
  } catch {
    return null;
  }
}
export function savePortalSession(s: PortalSession) {
  localStorage.setItem(PORTAL_KEY, JSON.stringify(s));
}
export function clearPortalSession() {
  localStorage.removeItem(PORTAL_KEY);
}

/** Instancia para PORTAL (usa token del cliente) */
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

/**
 * ===========================================
 *  Utils/helpers comunes
 * ===========================================
 */

function asArray<T = any>(data: any): T[] {
  return (Array.isArray(data) ? data : data?.items ?? data?.data ?? []) || [];
}

async function axGet<T>(path: string): Promise<T> {
  const r = await api.get(path, { validateStatus: () => true });
  if (r.status >= 200 && r.status < 300) return r.data as T;
  throw new Error(`HTTP ${r.status}`);
}

async function axDelete(path: string): Promise<void> {
  const r = await api.delete(path, { validateStatus: () => true });
  if (r.status === 204 || (r.status >= 200 && r.status < 300)) return;
  throw new Error(`HTTP ${r.status}`);
}

/**
 * ===========================================
 *  Helpers AUTH (panel)
 * ===========================================
 */

export type Me = {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  businessId?: string;
};

/**
 * Devuelve el usuario autenticado.
 * Prueba varias rutas típicas para mayor compatibilidad.
 */
export async function getMe(): Promise<Me | null> {
  const candidates = ["/auth/me", "/users/me", "/me"];
  for (const p of candidates) {
    try {
      const r = await api.get(p, { validateStatus: () => true });
      if (r.status >= 200 && r.status < 300 && r.data) return r.data as Me;
      if (r.status === 404) continue;
    } catch {
      // intenta la siguiente
    }
  }
  return null;
}

/**
 * ===========================================
 *  Helpers STAFF/ADMIN (panel)
 * ===========================================
 */

type CreatedCustomer = { id: string; name: string; existed?: boolean };

export type UserLite = { id: string; email: string; role: UserRole };

// Crear cliente (el backend toma el businessId del JWT)
export const createCustomer = (name: string, phone: string) =>
  api.post("/customers", { name, phone }).then((r) => r.data as CreatedCustomer);

// Listar usuarios
export const listUsers = () =>
  api
    .get("/users", { validateStatus: () => true })
    .then((r) => asArray<UserLite>(r.data));

// Crear usuario (alias de createStaff)
export const createUser = (email: string, password: string, role: UserRole) =>
  api.post("/users", { email, password, role }).then((r) => r.data as UserLite);

// Compat: helper previo
export const createStaff = (email: string, password: string, role: "ADMIN" | "BARBER") =>
  api.post("/users", { email, password, role }).then((r) => r.data);

// Listar clientes (con fallback de estructura)
export const listCustomers = () =>
  api
    .get("/customers", { validateStatus: () => true })
    .then((r) => asArray(r.data));

// Eliminar cliente (DELETE) con fallback de ruta
export async function deleteCustomer(id: string): Promise<void> {
  const pid = encodeURIComponent(id);
  const candidates = [`/customers/${pid}`, `/app/customers/${pid}`];
  let lastError: unknown = null;

  for (const p of candidates) {
    try {
      await axDelete(p);
      return;
    } catch (e: any) {
      lastError = e;
      // Si el endpoint no existe (404), probamos el siguiente
      if (String(e?.message || "").includes("HTTP 404")) continue;
      throw e;
    }
  }

  if (lastError) throw lastError;
}

// Añadir visita (suma “puntos”)
export const addVisit = (customerId: string, notes?: string) =>
  api.post(`/customers/${encodeURIComponent(customerId)}/visits`, { notes }).then((r) => r.data);

// Recompensas del cliente
export const getCustomerRewards = (customerId: string) =>
  axGet(`/customers/${encodeURIComponent(customerId)}/rewards`);

// Visitas del cliente
export const getCustomerVisits = (customerId: string) =>
  axGet(`/customers/${encodeURIComponent(customerId)}/visits`);

// Progreso hacia la siguiente recompensa
export const getCustomerProgress = (customerId: string) =>
  axGet(`/customers/${encodeURIComponent(customerId)}/progress`);

// URL pública del PNG del QR (sin JWT)
export const publicCustomerQrUrl = (customerId: string) =>
  `${baseURL}/public/customers/${encodeURIComponent(customerId)}/qr.png`;

/**
 * ===========================================
 *  Helpers PORTAL (cliente con OTP)
 * ===========================================
 */

// Solicitar OTP por móvil o correo
export async function requestCustomerOtp(body: { phone?: string; email?: string }) {
  const r = await axios.post(`${baseURL}/portal/otp/request`, body, {
    headers: { "Content-Type": "application/json" },
    validateStatus: () => true,
  });
  if (r.status >= 200 && r.status < 300) return true;
  throw new Error(r.data?.message || "No se pudo enviar el código.");
}

// Verificar OTP y devolver token del portal
export async function verifyCustomerOtp(body: { phone?: string; email?: string; code: string }) {
  const r = await axios.post(`${baseURL}/portal/otp/verify`, body, {
    headers: { "Content-Type": "application/json" },
    validateStatus: () => true,
  });
  if (r.status >= 200 && r.status < 300) return r.data;
  throw new Error(r.data?.message || "Código inválido o expirado.");
}

// Datos del cliente autenticado (portal)
export async function getMyVisits() {
  const r = await portalApi.get("/portal/me/visits", { validateStatus: () => true });
  if (r.status >= 200 && r.status < 300) return r.data as any[];
  return [];
}
export async function getMyRewards() {
  const r = await portalApi.get("/portal/me/rewards", { validateStatus: () => true });
  if (r.status >= 200 && r.status < 300) return r.data as any[];
  return [];
}

// ======== STAFF HELPERS (check-in) ========

export type CustomerLite = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  businessId?: string;
};

type LookupInput = { phone?: string; email?: string };

/**
 * Busca un cliente por teléfono o email.
 * Preferido: endpoint dedicado POST /customers/lookup
 * Fallback: filtrar en memoria desde /customers (si el backend aún no tiene lookup).
 */
export async function lookupCustomer(input: LookupInput): Promise<CustomerLite | null> {
  const body: LookupInput = {};
  if (input.phone) body.phone = input.phone.trim();
  if (input.email) body.email = input.email.trim();

  // 1) Intento con endpoint dedicado
  try {
    const r = await api.post("/customers/lookup", body, { validateStatus: () => true });
    if (r.status >= 200 && r.status < 300 && r.data && r.data.id) return r.data as CustomerLite;
  } catch {
    // continúa al fallback
  }

  // 2) Fallback: traer lista y filtrar (no ideal, pero útil en dev)
  try {
    const list = await listCustomers();
    const phoneNorm = (body.phone || "").replace(/\D/g, "");
    const emailNorm = (body.email || "").toLowerCase();
    const found = (list as any[]).find((c) => {
      const cPhone = String(c.phone || "").replace(/\D/g, "");
      const cEmail = String(c.email || "").toLowerCase();
      return (phoneNorm && cPhone.endsWith(phoneNorm)) || (emailNorm && cEmail === emailNorm);
    });
    return found || null;
  } catch {
    return null;
  }
}

/**
 * Acredita una visita por QR payload.
 * El payload viene del componente CustomerQR: { t:'axioma-visit', customerId, businessId }
 */
export async function addVisitFromQrPayload(payload: string) {
  let parsed: any;
  try {
    parsed = JSON.parse(payload);
  } catch {
    throw new Error("QR inválido: no es JSON.");
  }
  if (!parsed || parsed.t !== "axioma-visit" || !parsed.customerId) {
    throw new Error("QR inválido: formato no reconocido.");
  }
  return addVisit(parsed.customerId, "Visita por QR");
}

// Sumar visita por teléfono (crea cliente si no existe)
export function addVisitByPhone(phone: string, notes?: string) {
  return api.post("/customers/visits/by-phone", { phone, notes }).then((r) => r.data);
}

// Reenviar QR por WhatsApp (sólo ADMIN; respeta env del backend)
export function resendCustomerQr(customerId: string) {
  return api.post(`/customers/${encodeURIComponent(customerId)}/qr/send`).then((r) => r.data);
}
