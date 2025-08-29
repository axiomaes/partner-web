// partner-web/src/shared/api.ts
import axios, { AxiosHeaders, AxiosInstance } from "axios";
import { loadAuth } from "./auth";

// Detecta si estamos en el dominio de Stacks y usa el API público.
// Si VITE_API_BASE está definido, lo respeta.
const PROD_API = "https://axioma-api.stacks.axioma-creativa.es";

function computeBaseURL(): string {
  const viteEnv = (import.meta as any)?.env?.VITE_API_BASE;
  if (viteEnv && typeof viteEnv === "string" && viteEnv.trim() !== "") {
    return viteEnv;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // Ajusta el patrón si cambias el dominio
    if (host.endsWith(".axioma-creativa.es")) return PROD_API;
  }
  // Dev por defecto
  return "http://localhost:3000";
}

const baseURL = computeBaseURL();

export const api: AxiosInstance = axios.create({ baseURL });

// JSON por defecto
api.defaults.headers.common["Content-Type"] = "application/json";

// Interceptor: normaliza headers para evitar TS2322
api.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers || {});
  const auth = loadAuth();
  if (auth?.token) headers.set("Authorization", `Bearer ${auth.token}`);
  config.headers = headers;
  return config;
});

export default api;
