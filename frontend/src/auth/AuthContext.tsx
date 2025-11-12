import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../lib/api";

type AuthCtx = {
  isAuthenticated: boolean;
  token: string | null; // compat: alias de access
  access: string | null;
  refresh: string | null;
  loginWithToken: (access: string, refresh?: string | null) => void; // compat para flujos ya existentes
  login: (username: string, password: string) => Promise<boolean>; // recomendado
  logout: () => void;
  refreshAccess: () => Promise<string | null>;
};

const Ctx = createContext<AuthCtx | null>(null);

const LS_ACCESS = "access";
const LS_REFRESH = "refresh";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [access, setAccess] = useState<string | null>(() => localStorage.getItem(LS_ACCESS));
  const [refresh, setRefresh] = useState<string | null>(() => localStorage.getItem(LS_REFRESH));

  // sincroniza múltiples pestañas
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_ACCESS) setAccess(localStorage.getItem(LS_ACCESS));
      if (e.key === LS_REFRESH) setRefresh(localStorage.getItem(LS_REFRESH));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((a: string | null, r: string | null) => {
    setAccess(a);
    setRefresh(r);
    if (a) localStorage.setItem(LS_ACCESS, a);
    else localStorage.removeItem(LS_ACCESS);
    if (r) localStorage.setItem(LS_REFRESH, r);
    else localStorage.removeItem(LS_REFRESH);
  }, []);

  const loginWithToken = useCallback(
    (a: string, r: string | null = null) => {
      persist(a, r ?? refresh);
    },
    [persist, refresh]
  );

  const logout = useCallback(() => {
    persist(null, null);
  }, [persist]);

  const refreshAccess = useCallback(async (): Promise<string | null> => {
    if (!refresh) return null;
    try {
      const { data } = await api.post("/auth/refresh/", { refresh }); // backend: /api/auth/refresh/
      const newAccess: string | null = data?.access ?? null;
      if (newAccess) persist(newAccess, refresh);
      return newAccess;
    } catch {
      logout();
      return null;
    }
  }, [refresh, persist, logout]);

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const { data } = await api.post("/auth/token/", { username, password }); // backend: /api/auth/token/
        const a = data?.access as string | undefined;
        const r = data?.refresh as string | undefined;
        if (a && r) {
          persist(a, r);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [persist]
  );

  const value = useMemo<AuthCtx>(
    () => ({
      isAuthenticated: !!access,
      token: access, // compat con código existente
      access,
      refresh,
      loginWithToken,
      login,
      logout,
      refreshAccess,
    }),
    [access, refresh, loginWithToken, login, logout, refreshAccess]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return v;
}
