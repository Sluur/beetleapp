import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function PrivateRoute() {
  const { isAuthenticated } = useAuth();
  const loc = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: { pathname: loc.pathname, search: loc.search, hash: loc.hash } }} />;
  }
  return <Outlet />;
}
