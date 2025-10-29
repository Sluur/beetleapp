import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (isAuthenticated) nav("/observations", { replace: true });
  }, [isAuthenticated, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/token/", { username, password });
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      login(data.access);
      const to = (loc.state as any)?.from?.pathname ?? "/observations";
      nav(to, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.non_field_errors?.[0] || "Credenciales inválidas";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center bg-neutral-100 p-4">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-2xl overflow-hidden grid md:grid-cols-2">
        <div className="p-8 flex flex-col justify-center">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-1">Iniciar sesión</h2>
          <p className="text-sm text-neutral-500 mb-6">Ingresa tus credenciales para continuar</p>

          <form onSubmit={submit}>
            <label className="block mb-3">
              <span className="block text-sm text-neutral-700 mb-1">Usuario</span>
              <input
                className="w-full border border-neutral-300 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
                placeholder="Usuario"
                autoComplete="username"
                value={username}
                onChange={(e) => setU(e.target.value)}
                disabled={loading}
                required
              />
            </label>

            <label className="block mb-4">
              <span className="block text-sm text-neutral-700 mb-1">Contraseña</span>
              <div className="relative">
                <input
                  className="w-full border border-neutral-300 rounded-xl px-3 py-2 pr-10 outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
                  placeholder="Contraseña"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setP(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 text-sm px-2 py-1 hover:text-neutral-700"
                  tabIndex={-1}
                >
                  {showPwd ? "Ocultar" : "Ver"}
                </button>
              </div>
            </label>

            {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

            <button
              className="w-full bg-blue-600 text-white rounded-xl px-3 py-2 font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Ingresando…" : "Entrar"}
            </button>

            {/* Enlaces al final */}
            <div className="mt-4 flex items-center justify-between text-sm">
              <Link to="/register" className="text-neutral-700 hover:text-neutral-900 hover:underline">
                Registrarse
              </Link>
              <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700 hover:underline">
                Olvidé mi contraseña
              </Link>
            </div>
          </form>
        </div>

        {/* Columna derecha: imagen */}
        <div className="hidden md:block bg-neutral-200">
          <img src="/images/login-bg.jpg" alt="Login background" className="object-cover w-full h-full" />
        </div>
      </div>
    </div>
  );
}
