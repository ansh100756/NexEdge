import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    authService
      .getCurrentUser()
      .then((result) => {
        if (active && result?.success) setUser(result.user);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setBootstrapping(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = async (payload) => {
    setLoading(true);
    try {
      const result = await authService.login(payload);
      if (result?.success) {
        setUser(result.user);
        return { success: true, user: result.user };
      }
      return { success: false, message: result?.message || "Unable to sign in." };
    } catch (error) {
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const result = await authService.register(payload);
      return result?.success
        ? { success: true, message: result.message }
        : { success: false, message: result?.message || "Unable to create your account." };
    } catch (error) {
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({ user, loading, bootstrapping, login, register }),
    [user, loading, bootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
