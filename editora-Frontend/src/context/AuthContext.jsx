import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api, { getApiErrorMessage } from "../services/api";

export const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Fetch current logged-in user on app start or refresh
   */
  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      setAuthError(null);

      const response = await api.get("/auth/me");
      const currentUser = response?.data?.data?.user ?? null;
      setUser(currentUser);
    } catch (error) {
      setUser(null);
      localStorage.removeItem("editora_token");

      // 401 just means no active session, ignore. Other errors show message.
      if (error?.response?.status !== 401) {
        setAuthError(getApiErrorMessage(error, "Unable to verify your session."));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verify session on initial load
   */
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  /**
   * Listen for global 401 unauthorized events from Axios interceptor
   */
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setAuthError(null);
      localStorage.removeItem("editora_token");
    };

    window.addEventListener("editora:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("editora:unauthorized", handleUnauthorized);
    };
  }, []);

  /**
   * Register a new user account
   */
  const register = useCallback(async ({ name, email, password }) => {
    setAuthError(null);

    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      const token = response?.data?.data?.token;
      if (token) {
        localStorage.setItem("editora_token", token);
      }

      const registeredUser = response?.data?.data?.user ?? null;
      setUser(registeredUser);
      return response;
    } catch (error) {
      setUser(null);
      const message = getApiErrorMessage(error, "Registration failed.");
      setAuthError(message);
      throw error;
    }
  }, []);

  /**
   * Login user with email and password
   */
  const login = useCallback(async ({ email, password }) => {
    setAuthError(null);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const token = response?.data?.data?.token;
      if (token) {
        localStorage.setItem("editora_token", token);
      }

      const loggedInUser = response?.data?.data?.user ?? null;
      setUser(loggedInUser);
      return response;
    } catch (error) {
      setUser(null);
      const message = getApiErrorMessage(error, "Login failed.");
      setAuthError(message);
      throw error;
    }
  }, []);

  /**
   * Logout user and clear session
   */
  const logout = useCallback(async () => {
    setAuthError(null);

    try {
      await api.post("/auth/logout");
    } catch (error) {
      if (error?.response?.status !== 401) {
        setAuthError(getApiErrorMessage(error, "Logout request failed."));
      }
    } finally {
      localStorage.removeItem("editora_token");
      setUser(null);
    }
  }, []);

  /**
   * Reset/clear authentication error state
   */
  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  /**
   * Memoized context value for performance
   */
  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      isAuthenticated: Boolean(user),
      register,
      login,
      logout,
      refreshUser: fetchCurrentUser,
      clearAuthError,
    }),
    [
      user,
      loading,
      authError,
      register,
      login,
      logout,
      fetchCurrentUser,
      clearAuthError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to access AuthContext
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth must be used within an AuthProvider. " +
        "Wrap your application/routes with <AuthProvider>."
    );
  }

  return context;
};

export default AuthContext;

