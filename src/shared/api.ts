// partner-web/src/shared/api.ts
import axios, { AxiosHeaders, AxiosInstance } from "axios";
import { getToken } from "./auth";

/**
 * ===========================================
 *  Base URL (prod/dev) + axios instances
 * ===========================================
 */

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

const baseURL = computeBaseURL();

/** Instancia para STAFF/ADMIN (token de panel) */
export const api: AxiosInstance = axios.create({ baseURL });
api.defaults.headers.common["Content-Type"] = "application/json";
api.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  config.headers = headers;
  return config;
});

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
export const portalApi: AxiosInstance = axios.create({ baseURL });
portalApi.defaults.headers.common["Content-Type"] = "application/json";
portalApi.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers || {});
  const p = loadPortalSession();
  if (p?.token) headers.set("Authorization", `Bearer ${p.token}`);
  config.headers = headers;
  return config;
});

/**
 * ===========================================
 *  Helpers STAFF/ADMIN (panel)
 * ===========================================
 */

type CreatedCustomer = { id: string; name: string; existed?: boolean };

// Crear cliente (el backend toma el businessId del JWT)
export const createCustomer = (name: string, phone: string) =>
  api.post("/customers", { name, phone }).then((r) => r.data as CreatedCustomer);

// Crear staff (usuario) — el backend asigna el negocio por JWT
export const createStaff = (
  email: string,
  password: string,
  role: "ADMIN" | "BARBER"
) => api.post("/users", { email, password, role }).then((r) => r.data);

// Listar clientes
export const listCustomers = () =>
  api.get("/customers").then((r) =>
    Array.isArray(r.data) ? r.data : r.data.items ?? r.data.data ?? []
  );

// Añadir visita (suma “puntos”)
export const addVisit = (customerId: string, notes?: string) =>
  api.post(`/customers/${encodeURIComponent(customerId)}/visits`, { notes }).then((r) => r.data);

// Recompensas del cliente
export const getCustomerRewards = (customerId: string) =>
  api.get(`/customers/${encodeURIComponent(customerId)}/rewards`).then((r) => r.data);

// Visitas del cliente
export const getCustomerVisits = (customerId: string) =>
  api.get(`/customers/${encodeURIComponent(customerId)}/visits`).then((r) => r.data);

// Progreso hacia la siguiente recompensa
export const getCustomerProgress = (customerId: string) =>
  api.get(`/customers/${encodeURIComponent(customerId)}/progress`).then((r) => r.data);

// URL pública del PNG del QR (sin JWT)
export const publicCustomerQrUrl = (customerId: string) =>
  `${baseURL}/public/customers/${encodeURIComponent(customerId)}/qr.png`;

/**
 * ===========================================
 *  Helpers PORTAL (cliente con OTP)
 *  ⚠️ Ajusta las rutas si tu backend usa otras.
 * ===========================================
 */

// Solicitar OTP por móvil o correo
export async function requestCustomerOtp(body: { phone?: string; email?: string }) {
  const url = "/portal/otp/request";
  const r = await axios.post(baseURL + url, body, {
    headers: { "Content-Type": "application/json" },
    validateStatus: () => true,
  });
  if (r.status >= 200 && r.status < 300) return true;
  throw new Error(r.data?.message || "No se pudo enviar el código.");
}

// Verificar OTP y devolver token del portal
export async function verifyCustomerOtp(body: { phone?: string; email?: string; code: string }) {
  const url = "/portal/otp/verify";
  const r = await axios.post(baseURL + url, body, {
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

  // 2) Fallback: traer lista y filtrar (no ideal, pero funciona en dev)
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
  return api.post(`/customers/${encodeURIComponent(customerId)}/qr/resend`).then((r) => r.data);
}
