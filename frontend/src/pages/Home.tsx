import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="h-[calc(100vh-56px)] overflow-y-auto bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-slate-100 mask-[linear-gradient(0deg,transparent,black)] pointer-events-none" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-linear-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-linear-to-tr from-fuchsia-400/20 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 min-h-[85vh] flex items-center">
            <div className="grid items-center gap-12 lg:gap-20 md:grid-cols-2 w-full">

              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-blue-500/10 via-indigo-500/10 to-fuchsia-500/10 border border-blue-200/50 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-linear-to-r from-blue-500 to-indigo-500 animate-pulse" />
                  <span className="text-xs font-medium text-blue-700">Proyecto académico · UNSa</span>
                </div>

                <div className="space-y-4">
                  <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight">
                    <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">Beetle</span>
                    <br />
                    <span className="text-slate-900">App</span>
                  </h1>

                  <p className="text-slate-600 text-lg md:text-xl leading-relaxed max-w-xl">
                    Plataforma inteligente para registrar observaciones de campo e identificar escarabajos buceadores mediante
                    <span className="font-semibold text-slate-900"> Deep Learning</span>.
                  </p>

                  <p className="text-sm text-slate-500 max-w-xl flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-slate-400" />
                    En colaboración con grupos de investigación de la UBA y la Sociedad Entomológica Argentina
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    to={isAuthenticated ? "/observations" : "/login"}
                    className="group relative inline-flex items-center justify-center rounded-2xl px-8 py-4
                               text-base font-semibold text-white overflow-hidden
                               bg-linear-to-r from-blue-600 via-indigo-600 to-fuchsia-600
                               shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40
                               hover:scale-105 transition-all duration-300"
                  >
                    <span className="relative z-10">{isAuthenticated ? "Mis observaciones" : "Comenzar ahora"}</span>
                    <div className="absolute inset-0 bg-linear-to-r from-blue-700 via-indigo-700 to-fuchsia-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>

                  <Link
                    to="/observations/new"
                    className="inline-flex items-center justify-center rounded-2xl px-8 py-4
                               text-base font-medium text-slate-700
                               bg-white/80 backdrop-blur-sm border-2 border-slate-200
                               hover:bg-white hover:border-slate-300 hover:scale-105
                               shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Nueva observación
                  </Link>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50/50 border border-blue-100 max-w-md backdrop-blur-sm">
                  <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500 text-white text-sm font-bold">
                    i
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Subí fotos <span className="font-semibold">nítidas, centradas y bien iluminadas</span> de la zona diagnóstica para
                    mejorar la precisión.
                  </p>
                </div>
              </div>

              <div className="relative flex flex-col items-center justify-center">
                <img
                  src="/images/beetle.png"
                  alt="Escarabajo acuático"
                  className="w-full max-w-xl h-auto object-contain select-none"
                  draggable={false}
                />
                <div className="mt-4 rounded-2xl bg-white/90 backdrop-blur-sm px-4 py-2 text-xs font-semibold text-slate-700 shadow-md border border-slate-200">
                  Dytiscinae · buceadores
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="funcionalidades" className="relative py-20 md:py-28">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200/50">
                <span className="text-xs font-semibold text-blue-700 tracking-wider uppercase">Funcionalidades</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
                ¿Qué ofrece <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">BeetleApp</span>?
              </h2>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                Combinación de registro de campo, IA y análisis para estudiar la diversidad de escarabajos acuáticos.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div
                className="group relative rounded-3xl bg-linear-to-br from-white to-blue-50/30 p-8 border-2 border-blue-100 
                            hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 
                            transition-all duration-300"
              >
                <div className="absolute top-6 right-6 text-4xl opacity-10 group-hover:opacity-20 transition-opacity">📸</div>
                <div className="relative space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 text-white text-2xl shadow-lg">
                    📸
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Clasificación automática</h3>
                    <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">IA especializada</p>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Redes neuronales convolucionales pre-entrenadas predicen la especie más probable y su nivel de confianza desde una
                    fotografía.
                  </p>
                </div>
              </div>

              <div
                className="group relative rounded-3xl bg-linear-to-br from-white to-indigo-50/30 p-8 border-2 border-indigo-100 
                            hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 
                            transition-all duration-300"
              >
                <div className="absolute top-6 right-6 text-4xl opacity-10 group-hover:opacity-20 transition-opacity">📊</div>
                <div className="relative space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-600 text-white text-2xl shadow-lg">
                    📊
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Historial y reportes</h3>
                    <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide">Análisis temporal</p>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Seguimiento completo con fecha, ubicación e imagen. Estadísticas de especies frecuentes y distribución temporal.
                  </p>
                </div>
              </div>

              <div
                className="group relative rounded-3xl bg-linear-to-br from-white to-fuchsia-50/30 p-8 border-2 border-fuchsia-100 
                            hover:border-fuchsia-300 hover:shadow-2xl hover:shadow-fuchsia-500/10 hover:-translate-y-1 
                            transition-all duration-300"
              >
                <div className="absolute top-6 right-6 text-4xl opacity-10 group-hover:opacity-20 transition-opacity">🔬</div>
                <div className="relative space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-fuchsia-500 to-fuchsia-600 text-white text-2xl shadow-lg">
                    🔬
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Contribución científica</h3>
                    <p className="text-xs text-fuchsia-600 font-medium uppercase tracking-wide">Datos colaborativos</p>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Construcción de datasets colaborativos para reentrenar modelos y mejorar las herramientas de identificación futuras.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="sobre-proyecto" className="relative py-20 md:py-28 bg-linear-to-b from-slate-50 to-white">
          <div className="mx-auto w-full max-w-5xl px-6">
            <div className="text-center mb-12 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200">
                <span className="text-xs font-semibold text-slate-600 tracking-wider uppercase">Contexto académico</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900">Sobre el proyecto</h2>
            </div>

            <div className="space-y-6 text-slate-700 leading-relaxed text-base max-w-3xl mx-auto mb-16">
              <p>
                BeetleApp forma parte del trabajo{" "}
                <span className="font-semibold">
                  "Aplicación web y móvil para la clasificación automática de escarabajos mediante modelos de Deep Learning"
                </span>
                . El sistema se centra en escarabajos buceadores de la subfamilia <span className="italic font-medium">Dytiscinae</span>, un
                grupo de coleópteros acuáticos de importancia ecológica y taxonómica.
              </p>

              <p>
                Los modelos de IA utilizados fueron entrenados con imágenes obtenidas por investigadores especializados, empleando
                arquitecturas como <span className="font-medium">ResNet, GoogleNet, MobileNet y ShuffleNet</span>, capaces de distinguir
                diferencias morfológicas sutiles entre especies.
              </p>

              <p>
                Además de servir como herramienta de identificación, BeetleApp actúa como plataforma de recolección de datos para el
                reentrenamiento continuo de modelos, conectando investigación entomológica con desarrollo de software aplicado.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <a
                href="https://github.com/Sluur/beetleapp"
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border-2 border-slate-200 bg-white p-6 
                         hover:border-slate-900 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white text-lg font-bold shadow-lg group-hover:scale-110 transition-transform">
                    GH
                  </div>
                  <span className="text-slate-400 group-hover:text-slate-900 text-xl transition-colors">↗</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Repositorio del proyecto</h3>
                <p className="text-sm text-slate-600">Código fuente de la aplicación web y del servicio de inferencia.</p>
              </a>

              <div className="rounded-2xl border-2 border-slate-200 bg-white p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-500 text-white text-xl font-bold shadow-lg mb-4">
                  📚
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Trabajo académico</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Seminario Técnico Profesional (UNSa). Dirigido por Dr. Cristian Martínez y codirigido por Dra. Patricia Torres.
                </p>
              </div>

              <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 md:col-span-2 lg:col-span-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-fuchsia-500 to-purple-500 text-white text-xl font-bold shadow-lg mb-4">
                  ⚡
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Stack tecnológico</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Django REST · React + Vite · Tailwind CSS · Flask/PyTorch · MySQL</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative py-8 text-center border-t-2 border-slate-200 bg-white">
        <div className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">© {new Date().getFullYear()} BeetleApp</span>
          <span className="mx-2">·</span>
          <span>Proyecto académico UNSa</span>
          <span className="mx-2">·</span>
          <span>Entomología & Deep Learning</span>
        </div>
      </footer>
    </div>
  );
}
