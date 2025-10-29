import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthCtx = {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));

  // sincroniza múltiples pestañas
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") setToken(localStorage.getItem("token"));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      isAuthenticated: !!token,
      token,
      login: (t: string) => {
        localStorage.setItem("token", t);
        setToken(t);
      },
      logout: () => {
        localStorage.removeItem("token");
        setToken(null);
      },
    }),
    [token]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return v;
}
