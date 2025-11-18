// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { loginApi, refreshAccessApi } from "../api/api";

type AuthCtx = {
  isAuthenticated: boolean;
  access: string | null;
  refresh: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAccess: () => Promise<string | null>;
};

const Ctx = createContext<AuthCtx | null>(null);

const SS_ACCESS = "access";
const SS_REFRESH = "refresh";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<string | null>(null);
  const [refresh, setRefresh] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);

  // Restaurar tokens en el arranque
  useEffect(() => {
    (async () => {
      try {
        const storedAccess = await SecureStore.getItemAsync(SS_ACCESS);
        const storedRefresh = await SecureStore.getItemAsync(SS_REFRESH);
        setAccess(storedAccess);
        setRefresh(storedRefresh);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const persist = useCallback(async (a: string | null, r: string | null) => {
    setAccess(a);
    setRefresh(r);
    if (a) await SecureStore.setItemAsync(SS_ACCESS, a);
    else await SecureStore.deleteItemAsync(SS_ACCESS);

    if (r) await SecureStore.setItemAsync(SS_REFRESH, r);
    else await SecureStore.deleteItemAsync(SS_REFRESH);
  }, []);

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      try {
        const tokens = await loginApi(username, password);
        if (tokens.access && tokens.refresh) {
          await persist(tokens.access, tokens.refresh);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [persist]
  );

  const logout = useCallback(async () => {
    await persist(null, null);
  }, [persist]);

  const refreshAccess = useCallback(async (): Promise<string | null> => {
    if (!refresh) return null;
    const newAccess = await refreshAccessApi(refresh);
    if (!newAccess) {
      await logout();
      return null;
    }
    await persist(newAccess, refresh);
    return newAccess;
  }, [refresh, logout, persist]);

  const value = useMemo<AuthCtx>(
    () => ({
      isAuthenticated: !!access,
      access,
      refresh,
      login,
      logout,
      refreshAccess,
    }),
    [access, refresh, login, logout, refreshAccess]
  );

  if (booting) {
    // Podés devolver un loader, pantalla en blanco, etc.
    return null;
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return v;
}
