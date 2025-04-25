import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../services/api";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  error: string | null;

  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      token: null,
      error: null,

      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.post("/auth/login", {
            email,
            password,
          });

          // Extract user and token - adjust path based on API response
          const data = response.data.data || response.data;
          const user = data.user || data;
          console.log("set user", user);
          const token = data.token;

          if (!token) {
            throw new Error("No token received from server");
          }

          // Directly set localStorage for immediate availability
          localStorage.setItem("token", token);

          // Set token in api headers for future requests
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Redirect to dashboard
          window.location.href = "/dashboard";
        } catch (error: any) {
          set({
            error: error.response?.data?.message || "Login failed",
            isLoading: false,
            isAuthenticated: false,
          });
        }
      },

      signup: async (name, email, password) => {
        try {
          set({ isLoading: true, error: null });

          // Try with direct fetch call to bypass any Axios transformations
          try {
            const response = await fetch("/api/auth/register", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name,
                email,
                password,
              }),
              credentials: "include",
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || "Signup failed");
            }

            const { user, token } = data;

            // Set token in api headers for future requests
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (err) {
            // Fallback to axios approach
            const response = await api.post("/auth/register", {
              name,
              email,
              password,
            });
            const { user, token } = response.data;

            // Set token in api headers for future requests
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } catch (error: any) {
          console.error("Signup error:", error.response?.data || error);
          set({
            error: error.response?.data?.message || "Signup failed",
            isLoading: false,
            isAuthenticated: false,
          });
        }
      },

      logout: () => {
        // Remove token from api headers
        delete api.defaults.headers.common["Authorization"];

        // Clear tokens from localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("auth-storage");

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });

        // Redirect to login page
        window.location.href = "/login";
      },

      checkAuth: async () => {
        // Set loading state immediately
        set({ isLoading: true });

        let token = get().token;

        // Try to get token from direct localStorage if not in state
        if (!token) {
          token = localStorage.getItem("token");
          if (token) {
            // Update state with token from localStorage
            set({ token });
          }
        }

        if (!token) {
          set({ isLoading: false, isAuthenticated: false, user: null });
          return;
        }

        try {
          // Set token in api headers
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          // Make the API request to validate token and get user info
          const response = await api.get("/auth/me");

          // Handle response format from server
          if (response.data && response.data.success === true) {
            const userData = response.data.data;
            console.log("userdata", userData);
            set({
              user: userData,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Invalid response format
            throw new Error("Invalid response from server");
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          // Token is invalid or expired, logout
          get().logout();
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "auth-storage", // name of the item in localStorage
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);
