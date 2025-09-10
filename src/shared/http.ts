import { loadSession } from "./auth";

const API = (import.meta as any).env?.VITE_API_BASE as string;

async function req(path: string, init: RequestInit = {}) {
  const s = loadSession();
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  if (s?.token) headers.set("Authorization", `Bearer ${s.token}`);
  if (s?.businessId) headers.set("X-Business-Id", String(s.businessId)); // scoping staff
  const res = await fetch(`${API}${path}`, { ...init, headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res;
}

export const http = {
  get: <T=unknown>(p: string) => req(p).then(r => r.json() as Promise<T>),
  post: <T=unknown>(p: string, body: any) => req(p, { method: "POST", body: JSON.stringify(body) }).then(r => r.json() as Promise<T>),
  put:  <T=unknown>(p: string, body: any) => req(p, { method: "PUT",  body: JSON.stringify(body) }).then(r => r.json() as Promise<T>),
  del:  <T=unknown>(p: string) => req(p, { method: "DELETE" }).then(r => r.json() as Promise<T>),
};
