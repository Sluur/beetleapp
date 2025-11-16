import { Link, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import ObservationsList from "./pages/ObservationsList";
import NewObservation from "./pages/NewObservation";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import Home from "./pages/Home";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";

function NavBar() {
  const { isAuthenticated, logout } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();

  const isActive = (to: string) => loc.pathname === to || (to !== "/" && loc.pathname.startsWith(to));

  const linkCls = (to: string) =>
    `px-2 py-1 rounded-md hover:bg-blue-50 ${isActive(to) ? "text-blue-700 font-medium" : "text-neutral-700"}`;

  const handleLogout = () => {
    logout();
    nav("/login", { replace: true, state: { from: loc } });
  };

  return (
    <header className="shrink-0 h-14 bg-white border-b border-neutral-200 px-8 flex items-center justify-between">
      <Link to="/" className="font-bold text-2xl tracking-tight text-blue-500">
        BeetleApp
      </Link>
      <nav className="flex items-center gap-2">
        {isAuthenticated ? (
          <>
            <Link to="/observations" className={linkCls("/observations")}>
              Observaciones
            </Link>
            <Link to="/observations/new" className={linkCls("/observations/new")}>
              Nueva
            </Link>
            <button
              onClick={handleLogout}
              className="ml-1 rounded-md border border-neutral-300 px-3 py-1 text-sm text-neutral-700 hover:bg-neutral-50"
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
            {/* público */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="/reset" element={<ResetPassword />} />

 
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* privado */}
            <Route element={<PrivateRoute />}>
              <Route path="/observations" element={<ObservationsList />} />
              <Route path="/observations/new" element={<NewObservation />} />
            </Route>
            <Route path="/app" element={<AuthGate />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
