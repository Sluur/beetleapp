import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-[calc(100vh-56px)] bg-white flex flex-col">
      {/* Centro vertical */}
      <section className="flex-1 flex items-center">
        {/* contenedor más ancho */}
        <div className="mx-auto w-full max-w-7xl px-8">
          {/* 2 columnas, más separación */}
          <div className="grid items-center gap-16 md:grid-cols-2">
            {/* IZQUIERDA: texto + CTAs (más grande) */}
            <div>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
                <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
                  BeetleApp
                </span>
              </h1>

              <p className="mt-5 text-neutral-700 text-xl leading-relaxed">
                Identificá escarabajos con modelos de Deep Learning y guardá tus observaciones de campo de forma simple.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to={isAuthenticated ? "/observations" : "/login"}
                  className="inline-flex items-center justify-center rounded-xl px-7 py-3.5
                             text-base font-semibold text-white
                             bg-linear-to-r from-blue-600 via-indigo-600 to-fuchsia-600
                             shadow-sm hover:shadow transition"
                >
                  {isAuthenticated ? "Ir a mis observaciones" : "Comenzar ahora"}
                </Link>

                <Link
                  to="/observations/new"
                  className="inline-flex items-center justify-center rounded-xl px-7 py-3.5
                             text-base font-medium border border-neutral-300 text-neutral-800
                             hover:bg-neutral-50 transition"
                >
                  Nueva observación
                </Link>
              </div>

              <p className="mt-4 text-sm text-neutral-500">Tip: subí fotos nítidas y centradas para mejorar la precisión.</p>
            </div>

            {/* DERECHA: imagen GRANDE (PNG/SVG sin fondo) */}
            <div className="relative">
              <img
                src="/images/beetle.png"
                alt="Escarabajo"
                className="w-full h-[520px] md:h-[600px] object-contain select-none drop-shadow-2xl"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer pegado abajo */}
      <footer className="mt-auto py-6 text-center text-sm text-neutral-500">
        © {new Date().getFullYear()} BeetleApp — Proyecto académico
      </footer>
    </div>
  );
}
