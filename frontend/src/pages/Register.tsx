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

    // Validaciones locales
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
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center px-4">
      <div className="w-full max-w-5xl bg-white shadow-xl rounded-2xl overflow-hidden grid md:grid-cols-2">
        {/* Formulario */}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          <h2 className="text-2xl font-semibold text-neutral-900">Crear cuenta</h2>
          <p className="text-sm text-neutral-500 mt-1 mb-6">Completá tus datos para registrarte</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-700 mb-1">Usuario</label>
              <input
                name="username"
                value={form.username}
                onChange={onChange}
                className="w-full border border-neutral-300 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
                placeholder="Usuario"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-700 mb-1">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                className="w-full border border-neutral-300 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
                placeholder="usuario@correo.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-700 mb-1">Contraseña</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                className="w-full border border-neutral-300 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-700 mb-1">Repetir contraseña</label>
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={onChange}
                className="w-full border border-neutral-300 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
                placeholder="Repetí tu contraseña"
                autoComplete="new-password"
                required
              />
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

            <button
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-xl px-3 py-2 font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creando…" : "Registrarse"}
            </button>

            <div className="flex items-center justify-between text-sm pt-1">
              <Link to="/login" className="text-neutral-700 hover:text-neutral-900 hover:underline">
                Ya tengo cuenta
              </Link>
              <Link to="/forgot" className="text-blue-600 hover:text-blue-700 hover:underline">
                Olvidé mi contraseña
              </Link>
            </div>
          </form>
        </div>

        {/* Imagen */}
        <div className="hidden md:block bg-neutral-200">
          <img src="/images/login-bg.jpg" alt="Register background" className="object-cover w-full h-full" />
        </div>
      </div>
    </div>
  );
}
