import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

// Usamos VITE_API_BASE, y acá le agregamos "/api"
const RAW_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "http://127.0.0.1:8000";
const API_BASE = RAW_BASE.replace(/\/+$/, "") + "/api";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

export async function registerUser(data: { username: string; email: string; password: string }) {
  const res = await api.post("auth/register/", data);
  return res.data;
}

// Authorization: Bearer <access>
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function requestPasswordReset(email: string): Promise<void> {
  await api.post("/auth/password/reset/", { email });
}
export async function confirmPasswordReset(params: { uid: string; token: string; new_password: string }): Promise<void> {
  await api.post("/auth/password/reset/confirm/", params);
}

// Auto-refresh si 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig | undefined;

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem("refresh");
        if (!refresh) throw new Error("no-refresh");
        // OJO: tu backend expone /api/auth/refresh/
        const { data } = await axios.post(`${API_BASE}/auth/refresh/`, { refresh });
        const newAccess = (data as any)?.access as string | undefined;
        if (!newAccess) throw new Error("no-access");
        localStorage.setItem("access", newAccess);

        original.headers = original.headers ?? {};
        original.headers["Authorization"] = `Bearer ${newAccess}`;
        (api.defaults.headers.common as any)["Authorization"] = `Bearer ${newAccess}`;
        return api(original);
      } catch {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        // redirigir a login si lo deseas:
        // window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    // Si Django manda HTML, generamos mensaje más legible
    if (error.response && typeof error.response.data === "string") {
      const txt = error.response.data as string;
      if (/<!DOCTYPE html>/i.test(txt)) {
        return Promise.reject({
          ...error,
          message: "Error del servidor (HTML). Revisá logs del backend.",
        });
      }
    }
    return Promise.reject(error);
  }
);
