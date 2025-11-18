import { Routes, Route, Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import Login from "./pages/Login";
import ObservationsList from "./pages/ObservationsList";
import NewObservation from "./pages/NewObservation";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import Home from "./pages/Home";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import ReportsPage from "./pages/ReportsPage";

function NavBar() {
  const { isAuthenticated, logout } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();

  // ✅ activo solo si coincide exactamente con la ruta
  const isActive = (to: string) => loc.pathname === to;

  const linkCls = (to: string) =>
    `px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
      isActive(to) ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md" : "text-slate-700 hover:bg-slate-100"
    }`;

  const handleLogout = () => {
    logout();
    nav("/login", { replace: true, state: { from: loc } });
  };

  const isHomePage = loc.pathname === "/";

  return (
    <header className="shrink-0 h-16 bg-white/80 backdrop-blur-md border-b-2 border-slate-200 px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-8">
        <Link
          to="/"
          className="font-black text-2xl tracking-tight bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:scale-105 transition-transform"
        >
          BeetleApp
        </Link>

        {isHomePage && (
          <nav className="hidden md:flex items-center gap-1">
            <a
              href="#funcionalidades"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Funcionalidades
            </a>
            <a
              href="#sobre-proyecto"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Sobre el proyecto
            </a>
          </nav>
        )}
      </div>

      <nav className="flex items-center gap-2">
        {isAuthenticated ? (
          <>
            <Link to="/reports" className={linkCls("/reports")}>
              Reportes
            </Link>
            <Link to="/observations" className={linkCls("/observations")}>
              Observaciones
            </Link>
            <Link to="/observations/new" className={linkCls("/observations/new")}>
              Nueva
            </Link>
            <button
              onClick={handleLogout}
              className="ml-2 rounded-xl border-2 border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 
                       hover:bg-slate-50 hover:border-slate-300 transition-all duration-300"
              title="Cerrar sesión"
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className={linkCls("/login")}>
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}

function AuthGate() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/observations" : "/login"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="h-screen overflow-hidden flex flex-col bg-neutral-50">
        <NavBar />
        <main className="flex-1 min-h-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset" element={<ResetPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<PrivateRoute />}>
              <Route path="/observations" element={<ObservationsList />} />
              <Route path="/observations/new" element={<NewObservation />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Route>

            <Route path="/app" element={<AuthGate />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
