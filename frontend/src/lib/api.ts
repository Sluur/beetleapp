// src/lib/api.ts
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

declare module "axios" {
  // para usar config._retry sin errores de TS
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  // si alguna vez vuelves a sesión por cookies:
  // withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig | undefined;

    // —— intento de refresh si vence el access ——
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true; // evita bucle
      try {
        const refresh = localStorage.getItem("refresh");
        if (!refresh) throw new Error("no-refresh");

        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });

        localStorage.setItem("access", (data as any).access);
        original.headers = original.headers ?? {};
        original.headers["Authorization"] = `Bearer ${(data as any).access}`;

        // Actualizo default para futuras requests
        api.defaults.headers.common["Authorization"] = `Bearer ${(data as any).access}`;

        return api(original);
      } catch {
        // refresh falló → logout
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    // —— mensajes más limpios si Django devuelve HTML (<!DOCTYPE...) ——
    if (error.response && typeof error.response.data === "string") {
      const txt = error.response.data as string;
      if (/<!DOCTYPE html>/i.test(txt)) {
        return Promise.reject({
          ...error,
          message: "Error del servidor (HTML). Revisá la consola del backend para el detalle.",
        });
      }
    }

    return Promise.reject(error);
  }
);
