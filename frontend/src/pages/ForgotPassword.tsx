import { useState } from "react";
import { requestPasswordReset } from "../lib/api";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
      setMsg("Si el email existe, te enviamos un enlace para restablecer la contraseña.");
    } catch (err: any) {
      const m = err?.response?.data?.detail || (typeof err?.message === "string" ? err.message : "No se pudo enviar el correo.");
      setMsg(m);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center bg-neutral-100 p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">¿Olvidaste tu contraseña?</h1>
        <p className="text-sm text-neutral-500 mb-6">Ingresá tu correo y te enviaremos un enlace para restablecerla.</p>

        <form onSubmit={submit}>
          <label className="block mb-4">
            <span className="block text-sm text-neutral-700 mb-1">Email</span>
            <input
              type="email"
              className="w-full border border-neutral-300 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
              placeholder="tu@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || sent}
              required
            />
          </label>

          {msg && (
            <div
              className={`mb-3 text-sm rounded-lg px-3 py-2 border ${
                sent ? "text-green-700 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200"
              }`}
            >
              {msg}
            </div>
          )}

          <button
            className="w-full bg-blue-600 text-white rounded-xl px-3 py-2 font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading || sent}
          >
            {loading ? "Enviando…" : sent ? "Enlace enviado" : "Enviar enlace"}
          </button>

          <div className="mt-4 text-sm">
            <Link to="/login" className="text-neutral-700 hover:text-neutral-900 hover:underline">
              Volver al login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
