import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import "reflect-metadata";

import routes from "./routes";
import { initializeDatabase } from "./config/database";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// API routes
app.use("/api", routes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
const startServer = async () => {
  try {
    // Initialize database connection
    try {
      await initializeDatabase();
      console.log("Database connected successfully");
    } catch (dbError) {
      console.error("Database connection failed:", dbError.message);
      console.warn(
        "Starting server without database connection. Some features may not work."
      );
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(
        `API Documentation available at: http://localhost:${PORT}/api-docs`
      );
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
