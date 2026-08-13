import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./features/auth/state/AuthContext";
import { AuthShell } from "./features/auth/components/AuthShell/AuthShell";
import { AuthScreen } from "./features/auth/components/AuthScreen/AuthScreen";
import { VerifyEmail } from "./features/auth/components/VerifyEmail/VerifyEmail";
import { Dashboard } from "./features/dashboard/components/Dashboard/Dashboard";
import { FullPageLoader } from "./shared/components/FullPageLoader/FullPageLoader";

function PublicRoute() {
  const { user, bootstrapping } = useAuth();
  if (bootstrapping) return <FullPageLoader />;
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

function ProtectedRoute() {
  const { user, bootstrapping } = useAuth();
  const location = useLocation();
  if (bootstrapping) return <FullPageLoader />;
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route element={<AuthShell />}>
          <Route path="/login" element={<AuthScreen mode="login" />} />
          <Route path="/register" element={<AuthScreen mode="register" />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
