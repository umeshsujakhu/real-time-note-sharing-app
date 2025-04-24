import { Router } from "express";
import passport from "passport";
import * as authController from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { loginUserSchema, registerUserSchema } from "../types/user.types";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Local authentication routes
router.post(
  "/register",
  validate(registerUserSchema) as any,
  authController.register as any
);
router.post(
  "/login",
  validate(loginUserSchema) as any,
  authController.login as any
);

// Get current user profile
router.get("/me", authenticate as any, authController.getCurrentUser);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }) as any,
  authController.googleCallback as any
);

// Facebook OAuth routes
router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    session: false,
    failureRedirect: "/login",
  }) as any,
  authController.facebookCallback as any
);

export default router;
