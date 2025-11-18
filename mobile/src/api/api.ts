import axios, { AxiosError } from "axios";
import { API_BASE } from "../config";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});


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


