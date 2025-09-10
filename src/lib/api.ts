// partner-web/src/lib/api.ts
// ⚠️ SHIM de compatibilidad. Fuente de verdad: "@/shared/api".
// Reexporta tipos y funciones clave y ofrece un "makeApi" ligero compatible.

import {
  baseURL as SHARED_BASE,
  api as axiosApi,
  type CpBusiness,
  listCpBusinesses as listCpBusinessesShared,
} from "@/shared/api";

export type { CpBusiness } from "@/shared/api";

export type MakeApiOptions = {
  apiBase?: string;
  token?: string;                    // opcional; si no se pasa, usará axiosApi con su interceptor
  onAuthError?: () => void;
  headers?: Record<string, string>;
};

export type ApiClient = {
  getJson: <T = any>(path: string, init?: RequestInit) => Promise<T>;
  getText: (path: string, init?: RequestInit) => Promise<string>;
  postJson: <T = any>(path: string, body: any, init?: RequestInit) => Promise<T>;
  putJson:  <T = any>(path: string, body: any, init?: RequestInit) => Promise<T>;
  patchJson:<T = any>(path: string, body: any, init?: RequestInit) => Promise<T>;
  del: (path: string, init?: RequestInit) => Promise<Response>;
  downloadCsv: (path: string, filename: string) => Promise<void>;
  _base: string;
};

/** makeApi: si pasas token, usa fetch; si no, usa axiosApi (con interceptor de shared). */
export function makeApi(opts: MakeApiOptions = {}): ApiClient {
  const apiBase = (opts.apiBase || SHARED_BASE).replace(/\/+$/, "");
  const token = opts.token;
  const onAuthError = opts.onAuthError;

  const authHeader = token ? (token.startsWith("Bearer ") ? token : `Bearer ${token}`) : null;

  async function req(path: string, init: RequestInit = {}) {
    const url = `${apiBase}${path}`;

    // Modo fetch con token explícito
    if (authHeader) {
      const headers: Record<string, string> = {
        Accept: "application/json",
        ...(opts.headers || {}),
        ...(init.headers as Record<string, string> | undefined),
        Authorization: authHeader,
      };
      const res = await fetch(url, { ...init, headers, credentials: "include" });
      if (res.status === 401 || res.status === 403) { try { onAuthError?.(); } catch {} }
      if (!res.ok) {
        let msg = `${res.status} ${res.statusText}`;
        try {
          const data = await res.clone().json();
          if (data?.message) msg = data.message; else if (data?.error) msg = data.error;
        } catch {}
        const err: any = new Error(msg);
        err.status = res.status;
        throw err;
      }
      return res;
    }

    // Modo axios (sin token explícito): delega en axiosApi que ya añade Authorization
    const method = (init.method || "GET").toUpperCase();
    const headers = init.headers as Record<string, string> | undefined;
    const data = init.body;

    const r = await axiosApi.request({
      url: path,
      method,
      headers,
      data,
      withCredentials: true,
      validateStatus: () => true,
      responseType: "arraybuffer", // nos permite decidir si es texto/json después
    });

    if (r.status === 401 || r.status === 403) { try { onAuthError?.(); } catch {} }
    if (r.status < 200 || r.status >= 300) {
      let msg = `HTTP ${r.status}`;
      try {
        // intento de parseo como JSON
        const decoder = new TextDecoder();
        const text = decoder.decode(r.data);
        const json = JSON.parse(text);
        msg = json?.message || json?.error || msg;
      } catch {}
      const err: any = new Error(msg);
      err.status = r.status;
      throw err;
    }

    // Emular Response minimal para helpers
    const buf: ArrayBuffer = r.data as any;
    const decoder = new TextDecoder();
    const text = decoder.decode(buf);
    return new Response(text, {
      status: r.status,
      headers: new Headers(Object.entries(r.headers || {}) as any),
    });
  }

  return {
    _base: apiBase,
    getJson: async <T = any>(p: string, init?: RequestInit) => {
      const res = await req(p, { ...init, method: (init?.method || "GET") });
      return res.json() as Promise<T>;
    },
    getText: async (p: string, init?: RequestInit) => {
      const res = await req(p, { ...init, method: (init?.method || "GET") });
      return res.text();
    },
    postJson: async <T = any>(p: string, body: any, init?: RequestInit) => {
      const res = await req(p, {
        ...init,
        method: "POST",
        headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
        body: JSON.stringify(body),
      });
      const txt = await res.text();
      return (txt ? JSON.parse(txt) : null) as T;
    },
    putJson: async <T = any>(p: string, body: any, init?: RequestInit) => {
      const res = await req(p, {
        ...init,
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
        body: JSON.stringify(body),
      });
      const txt = await res.text();
      return (txt ? JSON.parse(txt) : null) as T;
    },
    patchJson: async <T = any>(p: string, body: any, init?: RequestInit) => {
      const res = await req(p, {
        ...init,
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
        body: JSON.stringify(body),
      });
      const txt = await res.text();
      return (txt ? JSON.parse(txt) : null) as T;
    },
    del: async (p: string, init?: RequestInit) => req(p, { ...init, method: "DELETE" }),
    downloadCsv: async (p: string, filename: string) => {
      const res = await req(p);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    },
  };
}

// Reexport directo del descubrimiento (usa axios de shared por defecto)
export async function listCpBusinesses(apiClient?: ApiClient): Promise<CpBusiness[]> {
  if (apiClient) {
    // Adaptador: usa fetch directo contra apiClient._base
    const ENDPOINTS = [
      "/cp/admin/businesses",
      "/cp/businesses",
      "/cp/admin/businesses/list",
      "/admin/businesses",
      "/businesses",
    ];
    for (const p of ENDPOINTS) {
      const res = await fetch(`${apiClient._base}${p}`, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      if (res.status === 404) continue;
      if (!res.ok) continue;
      const data = await res.json();
      return (Array.isArray(data) ? data : data?.items ?? data?.data ?? []) as CpBusiness[];
    }
    throw new Error("No existe endpoint CP para listar negocios.");
  }
  // si no pasan apiClient, delega al shared (axios con token del storage)
  return listCpBusinessesShared();
}
