import { api } from "@/shared/api";

/** Ajusta si tus endpoints reales son otros */
const REQ_OTP_URL = "/auth/customer/request-otp";  // POST { phone?: string, email?: string }
const VERIFY_OTP_URL = "/auth/customer/verify-otp"; // POST { phone/email, code } -> { token }
const ME_URL = "/customers/me";                     // GET -> { id, name, phone, ... }

const KEY = "axioma_customer_auth";

export type CustomerAuth = { token: string };

export function saveCustomerToken(token: string) {
  localStorage.setItem(KEY, JSON.stringify({ token }));
}
export function loadCustomerToken(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CustomerAuth).token : null;
  } catch { return null; }
}
export function clearCustomerToken() {
  localStorage.removeItem(KEY);
}

/** Pide OTP para phone/email */
export function requestCustomerOtp(identifier: { phone?: string; email?: string }) {
  return api.post(REQ_OTP_URL, identifier).then(r => r.data);
}

/** Verifica OTP; guarda token de cliente localmente */
export async function verifyCustomerOtp(payload: { phone?: string; email?: string; code: string }) {
  const data = await api.post(VERIFY_OTP_URL, payload).then(r => r.data);
  if (data?.token) saveCustomerToken(data.token);
  return data;
}

/** Llama con token del cliente (no del dashboard) */
export async function customerGet<T = any>(path: string): Promise<T> {
  const token = loadCustomerToken();
  const r = await api.get(path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return r.data as T;
}

export type Me = { id: string; name: string; phone?: string; email?: string };
export const customerMe = () => customerGet<Me>(ME_URL);
export const customerRewards = (id: string) => customerGet<any[]>(`/customers/${id}/rewards`);
export const customerVisits = (id: string) => customerGet<any[]>(`/customers/${id}/visits`);
