import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "./auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getMe()
      .then((result) => setUser(result.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const result = await authService.login(email, password);
    setUser(result.user);
    return result;
  }

  function register(email, password) {
    return authService.register(email, password);
  }

  async function logout() {
    await authService.logout();
    setUser(null);
  }

  const value = { user, loading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
