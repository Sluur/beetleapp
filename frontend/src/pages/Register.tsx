import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (form.password.length < 8) return setErr("La contraseña debe tener al menos 8 caracteres.");
    if (form.password !== form.confirmPassword) return setErr("Las contraseñas no coinciden.");

    setLoading(true);
    try {
      await api.post("auth/register/", {
        username: form.username,
        email: form.email,
        password: form.password,
      });
      nav("/login?ok=registered");
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.username) setErr(Array.isArray(data.username) ? data.username.join(", ") : data.username);
      else if (data?.email) setErr(Array.isArray(data.email) ? data.email.join(", ") : data.email);
      else if (data?.password) setErr(Array.isArray(data.password) ? data.password.join(", ") : data.password);
      else setErr(data?.detail || "No se pudo registrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center px-4">
      <div className="w-full max-w-5xl bg-white/80 backdrop-blur-md shadow-2xl rounded-3xl overflow-hidden border-2 border-slate-200 grid md:grid-cols-2">
        <div className="p-10 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Crear cuenta
            </h2>
            <p className="text-sm text-slate-600">Completá tus datos para registrarte</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Usuario</label>
              <input
                name="username"
                value={form.username}
                onChange={onChange}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none 
                         focus:ring-4 focus:ring-blue-100 focus:border-blue-500 
                         transition-all duration-300 font-medium"
                placeholder="Usuario"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none 
                         focus:ring-4 focus:ring-blue-100 focus:border-blue-500 
                         transition-all duration-300 font-medium"
                placeholder="usuario@correo.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Contraseña</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none 
                         focus:ring-4 focus:ring-blue-100 focus:border-blue-500 
                         transition-all duration-300 font-medium"
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Repetir contraseña</label>
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={onChange}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none 
                         focus:ring-4 focus:ring-blue-100 focus:border-blue-500 
                         transition-all duration-300 font-medium"
                placeholder="Repetí tu contraseña"
                autoComplete="new-password"
                required
              />
            </div>

            {error && <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 text-sm font-medium">{error}</div>}

            <button
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl 
                       px-4 py-3 font-bold hover:from-blue-600 hover:to-indigo-600 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {loading ? "Creando…" : "Registrarse"}
            </button>

            <div className="flex items-center justify-between text-sm pt-3 border-t-2 border-slate-100">
              <Link to="/login" className="text-slate-700 font-semibold hover:text-blue-600 transition-colors">
                Ya tengo cuenta
              </Link>
              <Link to="/forgot" className="text-blue-600 font-semibold hover:text-indigo-600 transition-colors">
                Olvidé mi contraseña
              </Link>
            </div>
          </form>
        </div>

        <div className="hidden md:block relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 z-10" />
          <img src="/images/login-bg.jpg" alt="Register background" className="object-cover w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-20" />
          <div className="absolute bottom-8 left-8 right-8 z-30 text-white">
            <h3 className="text-2xl font-bold mb-2">BeetleApp</h3>
            <p className="text-sm text-white/90">Plataforma de identificación de escarabajos mediante Deep Learning</p>
          </div>
        </div>
      </div>
    </div>
  );
}
