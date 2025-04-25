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
  useTheme,
  useMediaQuery,
  Fade,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

const Signup: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { signup, error, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
      setFormError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setIsSubmitting(true);
      await signup(name, email, password);
      // Redirect will happen automatically if signup is successful
    } catch (err) {
      // Error is already handled by auth context
      console.error("Signup failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Fade in timeout={800}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "calc(100vh - 64px)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 4,
              }}
            >
              <Box
                component="img"
                src="/logo.svg"
                alt="Notes App Logo"
                sx={{
                  width: isMobile ? 80 : 100,
                  height: isMobile ? 80 : 100,
                  mb: 2,
                }}
              />
              <Typography
                variant="h4"
                component="h1"
                align="center"
                sx={{
                  fontWeight: 700,
                  color: "white",
                  textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                Notes App
              </Typography>
              <Typography
                variant="subtitle1"
                align="center"
                sx={{ color: "rgba(255,255,255,0.9)", mt: 1 }}
              >
                Create your account to get started
              </Typography>
            </Box>

            <Paper
              elevation={8}
              sx={{
                p: 4,
                width: "100%",
                borderRadius: 4,
                backdropFilter: "blur(10px)",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                boxShadow:
                  "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
            >
              <Typography
                variant="h5"
                component="h2"
                align="center"
                color="primary"
                sx={{ mb: 3, fontWeight: 600 }}
              >
                Create Account
              </Typography>

              {(error || formError) && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {formError || error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="name"
                  label="Full Name"
                  name="name"
                  autoComplete="name"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading || isSubmitting}
                  sx={{ mb: 2 }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || isSubmitting}
                  sx={{ mb: 2 }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || isSubmitting}
                  sx={{ mb: 2 }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading || isSubmitting}
                  sx={{ mb: 3 }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 1,
                    mb: 3,
                    py: 1.5,
                    borderRadius: 2,
                    fontSize: "1rem",
                    fontWeight: 600,
                    background:
                      "linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)",
                    boxShadow:
                      "0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1)",
                    "&:hover": {
                      background:
                        "linear-gradient(90deg, #4338ca 0%, #4f46e5 100%)",
                    },
                  }}
                  disabled={isLoading || isSubmitting}
                >
                  {isLoading || isSubmitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Sign Up"
                  )}
                </Button>

                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    OR
                  </Typography>
                </Divider>

                <Button
                  fullWidth
                  variant="outlined"
                  sx={{
                    mb: 2,
                    py: 1.2,
                    borderRadius: 2,
                    borderColor: "rgba(0,0,0,0.1)",
                    color: "text.primary",
                    "&:hover": {
                      borderColor: "rgba(0,0,0,0.2)",
                      backgroundColor: "rgba(0,0,0,0.02)",
                    },
                  }}
                  onClick={() => (window.location.href = "/api/auth/google")}
                >
                  <Box
                    component="img"
                    src="https://www.google.com/favicon.ico"
                    alt="Google"
                    sx={{ width: 20, height: 20, mr: 1 }}
                  />
                  Sign up with Google
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  sx={{
                    mb: 3,
                    py: 1.2,
                    borderRadius: 2,
                    borderColor: "rgba(0,0,0,0.1)",
                    color: "text.primary",
                    "&:hover": {
                      borderColor: "rgba(0,0,0,0.2)",
                      backgroundColor: "rgba(0,0,0,0.02)",
                    },
                  }}
                  onClick={() => (window.location.href = "/api/auth/facebook")}
                >
                  <Box
                    component="img"
                    src="https://www.facebook.com/favicon.ico"
                    alt="Facebook"
                    sx={{ width: 20, height: 20, mr: 1 }}
                  />
                  Sign up with Facebook
                </Button>

                <Box textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    Already have an account?{" "}
                    <Link
                      component={RouterLink}
                      to="/login"
                      sx={{
                        color: "primary.main",
                        fontWeight: 600,
                        textDecoration: "none",
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                    >
                      Sign In
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default Signup;
