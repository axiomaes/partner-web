// partner-web/src/portal/customerApi.ts
import { api } from "@/shared/api";

/**
 * API del Portal (OTP público) – Endpoints:
 *  - POST /portal/otp/request  { contact }
 *  - POST /portal/otp/verify   { contact, code }
 *
 * Nota: "contact" puede ser un móvil (+34...) o un email.
 */

export type RequestOtpRes = { ok: true; devCode?: string };
export type VerifyOtpRes = { ok: true };

// ===== OTP (nuevo flujo) =====

export async function requestOtp(contact: string): Promise<RequestOtpRes> {
  const payload = { contact: contact.trim() };
  const { data } = await api.post("/portal/otp/request", payload);
  return data;
}

export async function verifyOtp(
  contact: string,
  code: string
): Promise<VerifyOtpRes> {
  const payload = { contact: contact.trim(), code: code.trim() };
  const { data } = await api.post("/portal/otp/verify", payload);
  return data;
}

// ===== Compatibilidad con nombres anteriores (si tu UI aún los usa) =====

/** Pide OTP aceptando { phone?, email? } y lo mapea a { contact } */
export function requestCustomerOtp(identifier: {
  phone?: string;
  email?: string;
}) {
  const contact = (identifier.phone ?? identifier.email ?? "").trim();
  return requestOtp(contact);
}

/** Verifica OTP aceptando { phone?, email?, code } y lo mapea a { contact, code } */
export async function verifyCustomerOtp(payload: {
  phone?: string;
  email?: string;
  code: string;
}) {
  const contact = (payload.phone ?? payload.email ?? "").trim();
  return verifyOtp(contact, payload.code);
}

// ===== (Opcional) Utilidades de token del cliente – por si más adelante emites JWT del portal =====

const KEY = "axioma_customer_auth";
export type CustomerAuth = { token: string };

export function saveCustomerToken(token: string) {
  localStorage.setItem(KEY, JSON.stringify({ token }));
}
export function loadCustomerToken(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CustomerAuth).token : null;
  } catch {
    return null;
  }
}
export function clearCustomerToken() {
  localStorage.removeItem(KEY);
}

/** Llama con token del cliente (si en el futuro el portal usa JWT propio) */
export async function customerGet<T = any>(path: string): Promise<T> {
  const token = loadCustomerToken();
  const r = await api.get(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return r.data as T;
}

// ===== Endpoints de ejemplo (si decides usarlos con token del portal) =====
export type Me = { id: string; name: string; phone?: string; email?: string };
export const customerMe = () => customerGet<Me>("/customers/me");
export const customerRewards = (id: string) =>
  customerGet<any[]>(`/customers/${id}/rewards`);
export const customerVisits = (id: string) =>
  customerGet<any[]>(`/customers/${id}/visits`);

// ===== Ayuda: URL pública del PNG de QR por si la necesitas en el Portal =====
export const publicQrUrl = (customerId: string) =>
  `${api.defaults.baseURL}/public/customers/${encodeURIComponent(
    customerId
  )}/qr.png`;
