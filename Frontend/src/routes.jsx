import { Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./features/auth/AuthPage";
import { useAuth } from "./features/auth/AuthContext";
import { CdnProvider } from "./features/cdn/CdnContext";
import AppShell from "./features/files/components/AppShell";
import FilePage from "./features/files/pages/FilePage";
import FilesPage from "./features/files/pages/FilesPage";

function PrivateRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loader">
        <span className="spinner" />
        Loading NexEdge…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <CdnProvider>
      <AppShell />
    </CdnProvider>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />

      <Route element={<PrivateRoutes />}>
        <Route path="/files" element={<FilesPage />} />
        <Route path="/files/:fileId" element={<FilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/files" replace />} />
    </Routes>
  );
}
