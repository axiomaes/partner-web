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

// Crear cliente
export const createCustomer = (name: string, phone: string, businessId: string) =>
  api
    .post("/customers", {
      name,
      phone,
      business: { connect: { id: businessId } },
    })
    .then((r) => r.data);

// Crear staff (usuario)
export const createStaff = (
  email: string,
  password: string,
  businessId: string,
  role: "ADMIN" | "BARBER"
) =>
  api
    .post("/users", {
      email,
      password,
      role,
      business: { connect: { id: businessId } },
    })
    .then((r) => r.data);

// Listar clientes
export const listCustomers = () =>
  api.get("/customers").then((r) =>
    Array.isArray(r.data) ? r.data : r.data.items ?? r.data.data ?? []
  );

// Añadir visita (suma “puntos”)
export const addVisit = (customerId: string, notes?: string) =>
  api.post(`/customers/${customerId}/visits`, { notes }).then((r) => r.data);

// Recompensas del cliente
export const getCustomerRewards = (customerId: string) =>
  api.get(`/customers/${customerId}/rewards`).then((r) => r.data);

// Visitas del cliente
export const getCustomerVisits = (customerId: string) =>
  api.get(`/customers/${customerId}/visits`).then((r) => r.data);

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

