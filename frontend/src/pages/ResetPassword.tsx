import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { confirmPasswordReset } from "../lib/api";

export default function ResetPassword() {
  const [sp] = useSearchParams();
  const nav = useNavigate();

  const [uid, setUid] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setUid(sp.get("uid") || "");
    setToken(sp.get("token") || "");
  }, [sp]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (pwd !== pwd2) {
      setMsg("Las contraseñas no coinciden.");
      return;
    }
    if (!uid || !token) {
      setMsg("El enlace es inválido o está incompleto.");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset({ uid, token, new_password: pwd });
      nav("/login", {
        replace: true,
        state: { resetOk: true, msg: "Contraseña actualizada. Iniciá sesión con tu nueva clave." },
      });
    } catch (err: any) {
      const m =
        err?.response?.data?.detail ||
        err?.response?.data?.token ||
        err?.response?.data?.uid ||
        (typeof err?.message === "string" ? err.message : "No se pudo actualizar la contraseña.");
      setMsg(typeof m === "string" ? m : "Error actualizando la contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center bg-neutral-100 p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Restablecer contraseña</h1>
        <p className="text-sm text-neutral-500 mb-6">Ingresá una nueva contraseña.</p>

        <form onSubmit={submit}>
          <label className="block mb-3">
            <span className="block text-sm text-neutral-700 mb-1">Nueva contraseña</span>
            <input
              type="password"
              className="w-full border border-neutral-300 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
              placeholder="••••••••"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              disabled={loading}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          <label className="block mb-4">
            <span className="block text-sm text-neutral-700 mb-1">Repetir contraseña</span>
            <input
              type="password"
              className="w-full border border-neutral-300 rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
              placeholder="••••••••"
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              disabled={loading}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          {msg && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{msg}</div>}

          <button
            className="w-full bg-blue-600 text-white rounded-xl px-3 py-2 font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Guardando…" : "Actualizar contraseña"}
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
