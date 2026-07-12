import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api
        .getMe()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem("token");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { access_token } = await api.login(email, password);
    localStorage.setItem("token", access_token);
    const me = await api.getMe();
    setUser(me);
    return me;
  };

  const loginDirect = async () => {
    // Direct login with default admin credentials
    try {
      const { access_token } = await api.login("admin@inventory.com", "admin123");
      localStorage.setItem("token", access_token);
      const me = await api.getMe();
      setUser(me);
    } catch (error) {
      console.error("Direct login failed:", error);
      // Fallback to mock user if backend is not available
      localStorage.removeItem("token");
      setUser({ id: 1, email: "admin@inventory.com", full_name: "Admin User", role: "admin" });
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, loading, login, loginDirect, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
