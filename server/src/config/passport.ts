import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import dotenv from "dotenv";

dotenv.config();

export const configurePassport = (): void => {
  // Dummy strategy for development when credentials aren't provided
  const dummyCallback = (accessToken, refreshToken, profile, done) => {
    return done(null, { id: "1", displayName: "Test User" });
  };

  // Google OAuth Strategy
  try {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID || "dummy-client-id",
          clientSecret:
            process.env.GOOGLE_CLIENT_SECRET || "dummy-client-secret",
          callbackURL:
            process.env.GOOGLE_CALLBACK_URL ||
            "http://localhost:3000/api/auth/google/callback",
        },
        dummyCallback
      )
    );
  } catch (error) {
    console.warn("Failed to initialize Google OAuth strategy:", error.message);
  }

  // Facebook OAuth Strategy
  try {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID || "dummy-app-id",
          clientSecret: process.env.FACEBOOK_APP_SECRET || "dummy-app-secret",
          callbackURL:
            process.env.FACEBOOK_CALLBACK_URL ||
            "http://localhost:3000/api/auth/facebook/callback",
          profileFields: ["id", "displayName", "photos", "email"],
        },
        dummyCallback
      )
    );
  } catch (error) {
    console.warn(
      "Failed to initialize Facebook OAuth strategy:",
      error.message
    );
  }
};
