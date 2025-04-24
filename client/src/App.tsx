import { Route, Routes, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { useAuthStore } from "./stores/authStore";
import { useNoteStore } from "./stores/noteStore";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LoadingSpinner from "./components/LoadingSpinner";

// Lazy load page components
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Notes = lazy(() => import("./pages/Notes"));
const SharedNotes = lazy(() => import("./pages/SharedNotes"));
const ArchivedNotes = lazy(() => import("./pages/ArchivedNotes"));
const TodoPage = lazy(() => import("./pages/TodoPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const { initializeSocket, disconnectSocket } = useNoteStore();

  // Run authentication check on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Initialize socket connection when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Initialize socket connection
      initializeSocket();

      // Request permission for notifications
      if (
        Notification.permission !== "granted" &&
        Notification.permission !== "denied"
      ) {
        Notification.requestPermission();
      }
    } else {
      // Disconnect socket when user logs out
      disconnectSocket();
    }
  }, [isAuthenticated, initializeSocket, disconnectSocket]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public routes - always accessible */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Redirect root to dashboard if authenticated, otherwise to login */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Protected routes - only shown when authenticated */}
        {isAuthenticated ? (
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/notes/:noteId" element={<Notes />} />
            <Route path="/shared" element={<SharedNotes />} />
            <Route path="/archived" element={<ArchivedNotes />} />
            <Route path="/todos" element={<TodoPage />} />
          </Route>
        ) : (
          // Redirect all protected routes to login when not authenticated
          <>
            <Route
              path="/dashboard"
              element={<Navigate to="/login" replace />}
            />
            <Route path="/notes" element={<Navigate to="/login" replace />} />
            <Route
              path="/notes/:noteId"
              element={<Navigate to="/login" replace />}
            />
            <Route path="/shared" element={<Navigate to="/login" replace />} />
            <Route
              path="/archived"
              element={<Navigate to="/login" replace />}
            />
            <Route path="/todos" element={<Navigate to="/login" replace />} />
          </>
        )}

        {/* Catch all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
