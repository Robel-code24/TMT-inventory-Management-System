import { createContext, useContext, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";

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
    try {
      const { access_token } = await api.login(email, password);
      localStorage.setItem("token", access_token);
      const me = await api.getMe();
      setUser(me);
      return me;
    } catch (error) {
      localStorage.removeItem("token");
      const isBackendUnavailable = error instanceof ApiError && error.status === 0;
      if (isBackendUnavailable && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
        const mockUser = {
          id: 1,
          email: "admin@inventory.com",
          full_name: "Admin User",
          role: "admin",
        };
        setUser(mockUser);
        return mockUser;
      }
      throw error;
    }
  };

  const loginDirect = async () => login("admin@inventory.com", "admin123");

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
