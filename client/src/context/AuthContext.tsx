import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

// Types
interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          // Configure axios to use token
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          // Fetch user data
          const response = await axios.get("/api/users/me");
          setUser(response.data.data);
          setIsLoading(false);
        } catch (err) {
          console.error("Failed to load user:", err);
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const response = await axios.post("/api/auth/login", { email, password });
      const { token: authToken, user: userData } = response.data.data;

      // Save to state and localStorage
      setToken(authToken);
      setUser(userData);
      localStorage.setItem("token", authToken);

      // Set Authorization header for future requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setError(null);
    try {
      const response = await axios.post("/api/auth/register", {
        name,
        email,
        password,
      });
      const { token: authToken, user: userData } = response.data.data;

      // Save to state and localStorage
      setToken(authToken);
      setUser(userData);
      localStorage.setItem("token", authToken);

      // Set Authorization header for future requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
      throw err;
    }
  };

  const logout = () => {
    // Remove token from localStorage and state
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);

    // Remove Authorization header
    delete axios.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
