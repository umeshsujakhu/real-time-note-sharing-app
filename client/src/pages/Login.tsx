import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Link,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { login, error, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic validation
    if (!email || !password) {
      setFormError("Please enter both email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      // Redirect will happen automatically if login is successful
    } catch (err) {
      // Error is already handled by auth context
      console.error("Login failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: "100%",
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            align="center"
            gutterBottom
            fontWeight="500"
          >
            Notes App
          </Typography>

          <Typography
            variant="h5"
            component="h2"
            align="center"
            color="primary"
            sx={{ mb: 3 }}
          >
            Sign In
          </Typography>

          {(error || formError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {formError || error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isSubmitting}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isSubmitting}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.2 }}
              disabled={isLoading || isSubmitting}
            >
              {isLoading || isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Sign In"
              )}
            </Button>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>

            <Button
              fullWidth
              variant="outlined"
              sx={{ mb: 1 }}
              onClick={() => (window.location.href = "/api/auth/google")}
            >
              Sign in with Google
            </Button>

            <Button
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
              onClick={() => (window.location.href = "/api/auth/facebook")}
            >
              Sign in with Facebook
            </Button>

            <Box textAlign="center" mt={2}>
              <Typography variant="body2">
                Don't have an account?{" "}
                <Link component={RouterLink} to="/signup">
                  Sign Up
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
