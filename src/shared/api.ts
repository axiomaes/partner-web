// partner-web/src/shared/api.ts
import axios, { AxiosHeaders, AxiosInstance } from "axios";
import { getToken } from "./auth";
import type { UserRole } from "./auth";

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

/** ============= Axios panel (staff/admin) ============= */
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

/** ============= Sesión / API Portal (OTP clientes) ============= */
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

/** ============= Tipos/Helpers panel ============= */
export type UserLite = { id: string; email: string; role: UserRole };

export type CustomerLite = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  businessId?: string;
};

type CreatedCustomer = { id: string; name: string; existed?: boolean };

/** Usuarios */
export const listUsers = () =>
  api.get("/users").then((r) =>
    Array.isArray(r.data) ? (r.data as UserLite[]) : ((r.data?.items ?? r.data?.data ?? []) as UserLite[])
  );

export const createUser = (email: string, password: string, role: UserRole) =>
  api.post("/users", { email, password, role }).then((r) => r.data as UserLite);

// Alias legacy
export const createStaff = (email: string, password: string, role: "ADMIN" | "BARBER") =>
  api.post("/users", { email, password, role }).then((r) => r.data);

/** Clientes */
export const listCustomers = () =>
  api.get("/customers").then((r) => (Array.isArray(r.data) ? r.data : r.data.items ?? r.data.data ?? []));

export const createCustomer = (name: string, phone: string) =>
  api.post("/customers", { name, phone }).then((r) => r.data as CreatedCustomer);

/** 👉 NUEVO: obtener un cliente (para mostrar nombre/phone/email) */
export async function getCustomer(id: string): Promise<CustomerLite | null> {
  try {
    const r = await api.get(`/customers/${encodeURIComponent(id)}`, { validateStatus: () => true });
    if (r.status >= 200 && r.status < 300 && r.data) {
      return r.data as CustomerLite;
    }
  } catch {
    // sigue al fallback
  }
  // Fallback: buscar en la lista si el endpoint no existe
  try {
    const all = await listCustomers();
    const hit = (all as any[]).find((c) => c.id === id) ?? null;
    return hit as CustomerLite | null;
  } catch {
    return null;
  }
}

/** 👉 NUEVO: eliminar cliente con manejo de 403/errores */
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

/** Visitas / recompensas / progreso / QR */
export const addVisit = (customerId: string, notes?: string) =>
  api.post(`/customers/${encodeURIComponent(customerId)}/visits`, { notes }).then((r) => r.data);

export const getCustomerRewards = (customerId: string) =>
  api.get(`/customers/${encodeURIComponent(customerId)}/rewards`).then((r) => r.data);

export const getCustomerVisits = (customerId: string) =>
  api.get(`/customers/${encodeURIComponent(customerId)}/visits`).then((r) => r.data);

export const getCustomerProgress = (customerId: string) =>
  api.get(`/customers/${encodeURIComponent(customerId)}/progress`).then((r) => r.data);

export const publicCustomerQrUrl = (customerId: string) =>
  `${baseURL}/public/customers/${encodeURIComponent(customerId)}/qr.png`;

export function resendCustomerQr(customerId: string) {
  return api.post(`/customers/${encodeURIComponent(customerId)}/qr/send`).then((r) => r.data);
}

/** ============= API Portal (OTP) ============= */
export async function requestCustomerOtp(body: { phone?: string; email?: string }) {
  const r = await axios.post(baseURL + "/portal/otp/request", body, {
    headers: { "Content-Type": "application/json" },
    validateStatus: () => true,
  });
  if (r.status >= 200 && r.status < 300) return true;
  throw new Error(r.data?.message || "No se pudo enviar el código.");
}

export async function verifyCustomerOtp(body: { phone?: string; email?: string; code: string }) {
  const r = await axios.post(baseURL + "/portal/otp/verify", body, {
    headers: { "Content-Type": "application/json" },
    validateStatus: () => true,
  });
  if (r.status >= 200 && r.status < 300) return r.data;
  throw new Error(r.data?.message || "Código inválido o expirado.");
}

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

/** Lee el payload del QR y registra una visita */
export function addVisitFromQrPayload(payload: string) {
  let parsed: any;
  try {
    parsed = JSON.parse(payload);
  } catch {
    throw new Error("QR inválido: no es JSON.");
  }

  if (!parsed || parsed.t !== "axioma-visit" || typeof parsed.customerId !== "string") {
    throw new Error("QR inválido: formato no reconocido.");
  }

  const notes = typeof parsed.notes === "string" ? parsed.notes : "Visita por QR";
  return addVisit(parsed.customerId, notes);
}


/** ============= Búsqueda/Check-in staff ============= */
type LookupInput = { phone?: string; email?: string };

export async function lookupCustomer(input: LookupInput): Promise<CustomerLite | null> {
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
    return found || null;
  } catch {
    return null;
  }
}

export function addVisitByPhone(phone: string, notes?: string) {
  return api.post("/customers/visits/by-phone", { phone, notes }).then((r) => r.data);
}
