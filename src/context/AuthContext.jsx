import React, { createContext, useEffect, useState, useCallback } from "react";
import { apiMe, apiLogout as _apiLogout } from "../config/api";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiMe();
      setUser(res.user);
    } catch (e) {
      console.warn("Auth loadMe failed:", e.message);
      // limpiar credenciales si falla
      localStorage.removeItem("token");
      localStorage.removeItem("rol");
      localStorage.removeItem("username");
      localStorage.removeItem("userId");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  function logout() {
    _apiLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, reload: loadMe, logout }}>
      {children}
    </AuthContext.Provider>
  );
}