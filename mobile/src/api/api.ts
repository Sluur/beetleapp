// src/api/api.ts
import axios, { AxiosError } from "axios";
import { API_BASE } from "../config";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// ------------------ Auth ------------------

export type TokenResponse = {
  access: string;
  refresh: string;
};

export async function loginApi(username: string, password: string): Promise<TokenResponse> {
  const { data } = await api.post("/auth/token/", { username, password });
  return data;
}

export async function refreshAccessApi(refresh: string): Promise<string | null> {
  try {
    const { data } = await api.post("/auth/refresh/", { refresh });
    const newAccess = (data as any)?.access as string | undefined;
    return newAccess ?? null;
  } catch {
    return null;
  }
}

// Opcionales para más adelante:
export async function registerUser(data: { username: string; email: string; password: string }) {
  const res = await api.post("/auth/register/", data);
  return res.data;
}

export async function requestPasswordReset(email: string): Promise<void> {
  await api.post("/auth/password/reset/", { email });
}

export async function confirmPasswordReset(params: { uid: string; token: string; new_password: string }): Promise<void> {
  await api.post("/auth/password/reset/confirm/", params);
}
