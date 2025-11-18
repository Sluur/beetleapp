import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
      const ok = await login(username, password);
      if (!ok) {
        setError("Credenciales inválidas");
        return;
      }
      const to = (loc.state as any)?.from?.pathname ?? "/observations";
      nav(to, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.non_field_errors?.[0] || "No se pudo iniciar sesión";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4">
      <div className="w-full max-w-5xl bg-white/80 backdrop-blur-md shadow-2xl rounded-3xl overflow-hidden border-2 border-slate-200 grid md:grid-cols-2">
        {/* Formulario */}
        <div className="p-10 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Iniciar sesión
            </h2>
            <p className="text-sm text-slate-600">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <label className="block">
              <span className="block text-sm font-semibold text-slate-700 mb-2">Usuario</span>
              <input
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none 
                         focus:ring-4 focus:ring-blue-100 focus:border-blue-500 
                         transition-all duration-300 font-medium"
                placeholder="Usuario"
                autoComplete="username"
                value={username}
                onChange={(e) => setU(e.target.value)}
                disabled={loading}
                required
              />
            </label>

            <label className="block">
              <span className="block text-sm font-semibold text-slate-700 mb-2">Contraseña</span>
              <div className="relative">
                <input
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 pr-20 outline-none 
                           focus:ring-4 focus:ring-blue-100 focus:border-blue-500 
                           transition-all duration-300 font-medium"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-semibold 
                           px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? "Ocultar" : "Ver"}
                </button>
              </div>
            </label>

            {error && <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 text-sm font-medium">{error}</div>}

            <button
              className="w-full bg-linear-to-r from-blue-500 to-indigo-500 text-white rounded-xl 
                       px-4 py-3 font-bold hover:from-blue-600 hover:to-indigo-600 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={loading}
            >
              {loading ? "Ingresando…" : "Entrar"}
            </button>

            <div className="mt-6 flex items-center justify-between text-sm pt-2 border-t-2 border-slate-100">
              <Link to="/register" className="text-slate-700 font-semibold hover:text-blue-600 transition-colors">
                Registrarse
              </Link>
              <Link to="/forgot-password" className="text-blue-600 font-semibold hover:text-indigo-600 transition-colors">
                Olvidé mi contraseña
              </Link>
            </div>
          </form>
        </div>

        {/* Imagen */}
        <div className="hidden md:block relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-blue-500/20 to-indigo-500/20 z-10" />
          <img src="/images/login-bg.jpg" alt="Login background" className="object-cover w-full h-full" />
          <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent z-20" />
          <div className="absolute bottom-8 left-8 right-8 z-30 text-white">
            <h3 className="text-2xl font-bold mb-2">BeetleApp</h3>
            <p className="text-sm text-white/90">Plataforma de identificación de escarabajos mediante Deep Learning</p>
          </div>
        </div>
      </div>
    </div>
  );
}
