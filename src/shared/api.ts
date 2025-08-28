// web/src/shared/api.ts
import axios, { AxiosHeaders, AxiosInstance } from "axios";
import { loadAuth } from "./auth";

const baseURL =
  (import.meta as any)?.env?.VITE_API_BASE ?? "http://localhost:3000";

export const api: AxiosInstance = axios.create({ baseURL });

// Asegura JSON por defecto (opcional)
api.defaults.headers.common["Content-Type"] = "application/json";

// Interceptor: normaliza headers a AxiosHeaders para evitar TS2322
api.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers || {});
  const auth = loadAuth();

  if (auth?.token) {
    headers.set("Authorization", `Bearer ${auth.token}`);
  }

  // Mantén cualquier header que ya existiera
  config.headers = headers;
  return config;
});

export default api;
