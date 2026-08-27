import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      setAuthError(null);

      const response = await api.get("/auth/me");
      setUser(response.data?.data?.user || null);
    } catch (error) {
      setUser(null);
      localStorage.removeItem("editora_token");
      if (error?.response?.status !== 401) {
        setAuthError("Unable to verify your session.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      localStorage.removeItem("editora_token");
    };

    window.addEventListener("editora:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("editora:unauthorized", handleUnauthorized);
    };
  }, []);

  const register = async ({ name, email, password }) => {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
    });

    const token = response.data?.data?.token;
    if (token) {
      localStorage.setItem("editora_token", token);
    }

    const registeredUser = response.data?.data?.user;
    setUser(registeredUser || null);
    return response;
  };

  const login = async ({ email, password }) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const token = response.data?.data?.token;
    if (token) {
      localStorage.setItem("editora_token", token);
    }

    const loggedInUser = response.data?.data?.user;
    setUser(loggedInUser || null);
    return response;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("editora_token");
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    authError,
    isAuthenticated: Boolean(user),
    register,
    login,
    logout,
    refreshUser: fetchCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
