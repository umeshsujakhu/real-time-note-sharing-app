import React, { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import LoadingSpinner from "./LoadingSpinner";

// This component is no longer needed since route protection is handled directly in App.tsx
// Keeping it for reference or future use

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, checkAuth, token } = useAuthStore();
  const location = useLocation();

  // Force an auth check on each protected route navigation
  useEffect(() => {
    checkAuth();
  }, [location.pathname, checkAuth]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
