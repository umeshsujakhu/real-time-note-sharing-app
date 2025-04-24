import axios from "axios";

// Create an axios instance with default configuration
const api = axios.create({
  baseURL: "/api", // This uses the proxy setup in vite.config.ts
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies/sessions
});

// Try to get token from multiple possible storage locations
let authToken = null;

// Try from zustand persist storage
try {
  const authStorage = localStorage.getItem("auth-storage");
  if (authStorage) {
    const parsedStorage = JSON.parse(authStorage);
    authToken = parsedStorage.state?.token;
  }
} catch (e) {
  console.error("Error parsing auth-storage:", e);
}

// Try direct token storage as fallback
if (!authToken) {
  authToken = localStorage.getItem("token");
}

// Apply token if found
if (authToken) {
  console.log("Found auth token in storage, applying to requests");
  api.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
}

// Debug interceptor to log requests and responses
api.interceptors.request.use(
  (config) => {
    // Make sure data is properly stringified for JSON requests
    if (config.data && config.headers["Content-Type"] === "application/json") {
      // Ensure data is not already a string
      if (typeof config.data !== "string") {
        console.log("Converting data to JSON string");
      }
    }

    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle common responses
api.interceptors.response.use(
  (response) => {
    console.log("API Response:", {
      status: response.status,
      data: response.data,
      headers: response.headers,
    });
    return response;
  },
  (error) => {
    // Handle common errors (401, 403, etc.)
    console.error("Response error:", error.response || error);

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status === 401) {
        // Unauthorized - redirect to login
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
