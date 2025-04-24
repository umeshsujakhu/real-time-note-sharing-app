export const config = {
  jwtSecret: process.env.JWT_SECRET || "your-secret-key",
  jwtExpiresIn: "1d",
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/notes-app",
};
