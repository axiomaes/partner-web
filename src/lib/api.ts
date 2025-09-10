// partner-web/src/lib/api.ts

export type MakeApiOptions = {
  apiBase: string;
  token: string;                       // puede ser "Bearer ..." o solo el JWT
  onAuthError?: () => void;            // se llamará en 401/403
  headers?: Record<string, string>;    // cabeceras extra por defecto
};

export type ApiClient = {
  /** GET JSON */
  getJson: <T = any>(path: string, init?: RequestInit) => Promise<T>;
  /** GET como texto plano */
  getText: (path: string, init?: RequestInit) => Promise<string>;
  /** POST JSON (body se serializa a JSON, parsea JSON de respuesta) */
  postJson: <T = any>(path: string, body: any, init?: RequestInit) => Promise<T>;
  /** PUT JSON */
  putJson:  <T = any>(path: string, body: any, init?: RequestInit) => Promise<T>;
  /** PATCH JSON */
  patchJson:<T = any>(path: string, body: any, init?: RequestInit) => Promise<T>;
  /** DELETE (devuelve Response por si no hay cuerpo) */
  del: (path: string, init?: RequestInit) => Promise<Response>;
  /** Descargar CSV/archivo como blob y forzar descarga */
  downloadCsv: (path: string, filename: string) => Promise<void>;
  /** Exponer base para utilidades */
  _base: string;
};

/** ========= Firma retrocompatible =========
 * - Versión antigua: makeApi(apiBase, token)
 * - Versión nueva:   makeApi({ apiBase, token, onAuthError?, headers? })
 */
export function makeApi(apiBase: string, token: string): ApiClient;
export function makeApi(opts: MakeApiOptions): ApiClient;
export function makeApi(apiBaseOrOpts: string | MakeApiOptions, tokenMaybe?: string): ApiClient {
  const isOpts = typeof apiBaseOrOpts === "object";
  const apiBase = (isOpts ? (apiBaseOrOpts as MakeApiOptions).apiBase : (apiBaseOrOpts as string)).replace(/\/+$/, "");
  const token = (isOpts ? (apiBaseOrOpts as MakeApiOptions).token : (tokenMaybe as string)) || "";
  const onAuthError = (isOpts ? (apiBaseOrOpts as MakeApiOptions).onAuthError : undefined) || undefined;
  const extraHeaders = (isOpts ? (apiBaseOrOpts as MakeApiOptions).headers : undefined) || undefined;

  const auth = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

  async function req(path: string, init: RequestInit = {}) {
    const url = `${apiBase}${path}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(extraHeaders || {}),
      ...(init.headers as Record<string, string> | undefined),
      Authorization: auth,
    };

    // Si el método es POST/PUT/PATCH y no hay Content-Type explícito pero hay body objeto,
    // postJson/putJson/patchJson lo establecen; para GET no hace falta.
    const res = await fetch(url, {
      ...init,
      headers,
      credentials: "include",
    });

    // Manejo de 401/403 (opcional)
    if (res.status === 401 || res.status === 403) {
      try { onAuthError?.(); } catch {}
    }

    if (!res.ok) {
      // Intenta leer mensaje de error si viene JSON
      let msg = `${res.status} ${res.statusText}`;
      try {
        const data = await res.clone().json();
        if (data?.message) msg = data.message;
        else if (data?.error) msg = data.error;
      } catch {}
      const err = new Error(msg);
      // @ts-expect-error attach status
      (err as any).status = res.status;
      throw err;
    }
    return res;
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
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers || {}),
        },
        body: JSON.stringify(body),
      });
      // Algunas APIs devuelven 204 sin cuerpo
      const text = await res.text();
      return (text ? JSON.parse(text) : null) as T;
    },

    putJson: async <T = any>(p: string, body: any, init?: RequestInit) => {
      const res = await req(p, {
        ...init,
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers || {}),
        },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      return (text ? JSON.parse(text) : null) as T;
    },

    patchJson: async <T = any>(p: string, body: any, init?: RequestInit) => {
      const res = await req(p, {
        ...init,
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers || {}),
        },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      return (text ? JSON.parse(text) : null) as T;
    },

    del: async (p: string, init?: RequestInit) => {
      return req(p, { ...init, method: "DELETE" });
    },

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

/* ============================================================
   Helpers específicos para CPanel (descubrimiento de endpoint)
   ============================================================ */

export type CpBusiness = { id: string; name?: string; displayName?: string };

// En base a tu repo server/src/cp/* probamos estos endpoints en orden:
export const DEFAULT_CP_BIZ_ENDPOINTS = [
  "/cp/admin/businesses",       // por admin-businesses.controller.ts
  "/cp/businesses",
  "/cp/admin/businesses/list",  // por si exponen /list
  "/admin/businesses",
  "/businesses",
] as const;

/**
 * Descubre el endpoint válido para listar negocios del CPanel.
 * Devuelve el array de negocios (vacío si no hay).
 * Lanza un error si ninguno existe o si todos fallan con códigos != 404.
 */
export async function listCpBusinesses(
  api: ApiClient,
  endpoints: readonly string[] = DEFAULT_CP_BIZ_ENDPOINTS
): Promise<CpBusiness[]> {
  let lastErr: any = null;

  for (const path of endpoints) {
    try {
      const res = await fetch(`${api._base}${path}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      if (res.status === 404) {
        continue; // probar siguiente
      }

      if (!res.ok) {
        // guardar último error “real”
        let msg = `${res.status} ${res.statusText}`;
        try {
          const data = await res.clone().json();
          if (data?.message) msg = data.message;
          else if (data?.error) msg = data.error;
        } catch {}
        lastErr = new Error(`${msg} en ${path}`);
        continue;
      }

      const data = await res.json();
      const items = (Array.isArray(data) ? data : data?.items ?? data?.data ?? []) as CpBusiness[];
      if (Array.isArray(items)) {
        return items;
      } else {
        // formato inesperado pero el endpoint existe: devolvemos array vacío
        return [];
      }
    } catch (e) {
      lastErr = e;
      continue;
    }
  }

  if (lastErr) throw lastErr;
  throw new Error("No existe endpoint CP para listar negocios (probados: " + endpoints.join(", ") + ")");
}
