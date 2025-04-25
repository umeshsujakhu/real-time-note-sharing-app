import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { LoginUserInput, RegisterUserInput } from "../types/user.types";

const authService = new AuthService();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: User already exists
 */
export const register = async (req: Request, res: Response) => {
  try {
    // Log the raw request body for debugging
    console.log("Register endpoint - Raw request body:", req.body);

    // Extra validation for required fields
    if (!req.body.name || !req.body.email || !req.body.password) {
      console.error("Missing required fields:", {
        name: !!req.body.name,
        email: !!req.body.email,
        password: !!req.body.password,
      });

      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        details: {
          name: req.body.name ? "present" : "missing",
          email: req.body.email ? "present" : "missing",
          password: req.body.password ? "present" : "missing",
        },
      });
    }

    const userData: RegisterUserInput = req.body;
    console.log("Register endpoint - Parsed userData:", {
      name: userData.name,
      email: userData.email,
      password: userData.password ? "REDACTED" : undefined,
    });

    const user = await authService.register(userData);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    console.error("Register endpoint - Error:", error);
    const message =
      error instanceof Error ? error.message : "Registration failed";
    return res.status(400).json({
      success: false,
      message,
    });
  }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to get authentication token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
export const login = async (req: Request, res: Response) => {
  try {
    const credentials: LoginUserInput = req.body;
    const { user, token } = await authService.login(credentials);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user, token },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return res.status(401).json({
      success: false,
      message,
    });
  }
};

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback endpoint
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Google auth successful
 *       401:
 *         description: Authentication failed
 */
export const googleCallback = async (req: Request, res: Response) => {
  try {
    // The user profile will be added to req.user by Passport
    const { user, token } = await authService.handleGoogleAuth(req.user);

    // Redirect to client app with token
    return res.redirect(
      `${
        process.env.CLIENT_URL || "http://localhost:3000"
      }/auth/callback?token=${token}`
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Google authentication failed";
    return res.status(401).json({
      success: false,
      message,
    });
  }
};

/**
 * @swagger
 * /api/auth/facebook/callback:
 *   get:
 *     summary: Facebook OAuth callback endpoint
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Facebook auth successful
 *       401:
 *         description: Authentication failed
 */
export const facebookCallback = async (req: Request, res: Response) => {
  try {
    // The user profile will be added to req.user by Passport
    const { user, token } = await authService.handleFacebookAuth(req.user);

    // Redirect to client app with token
    return res.redirect(
      `${
        process.env.CLIENT_URL || "http://localhost:3000"
      }/auth/callback?token=${token}`
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Facebook authentication failed";
    return res.status(401).json({
      success: false,
      message,
    });
  }
};

export const getCurrentUser = async (req: any, res: any) => {
  try {
    // User info is attached to req.currentUser by the authenticate middleware
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }
    console.log(req.currentUser);
    res.status(200).json({
      success: true,
      data: {
        id: req.currentUser.userId,
        name: req.currentUser.name,
        email: req.currentUser.email,
        role: req.currentUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get user profile",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
