// partner-web/src/shared/api.ts
import axios, { AxiosHeaders, AxiosInstance } from "axios";
import { getToken } from "./auth";

const PROD_API = "https://axioma-api.stacks.axioma-creativa.es";

function computeBaseURL(): string {
  const viteEnv = (import.meta as any)?.env?.VITE_API_BASE;
  if (viteEnv && typeof viteEnv === "string" && viteEnv.trim() !== "") {
    return viteEnv;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.endsWith(".axioma-creativa.es")) return PROD_API;
  }
  return "http://localhost:3000";
}

const baseURL = computeBaseURL();

export const api: AxiosInstance = axios.create({ baseURL });
api.defaults.headers.common["Content-Type"] = "application/json";

// Interceptor: inyecta token desde auth.getToken()
api.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  config.headers = headers;
  return config;
});

// === Helpers específicos ===

// Crear cliente
export const createCustomer = (name: string, phone: string, businessId: string) =>
  api.post("/customers", {
    name,
    phone,
    business: { connect: { id: businessId } },
  }).then(r => r.data);

// Crear staff (usuario)
export const createStaff = (
  email: string,
  password: string,
  businessId: string,
  role: "ADMIN" | "BARBER"
) =>
  api.post("/users", {
    email,
    password,
    role,
    business: { connect: { id: businessId } },
  }).then(r => r.data);

// Listar clientes
export const listCustomers = () =>
  api.get("/customers").then(r =>
    Array.isArray(r.data) ? r.data : (r.data.items ?? r.data.data ?? [])
  );
