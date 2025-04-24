import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import bodyParser from "body-parser";
import "reflect-metadata";
import http from "http";
import { SocketService } from "./services/socket.service";

import routes from "./routes";
import { initializeDatabase } from "./config/database";
import {
  rawBodyParser,
  requestLogger,
} from "./middlewares/body-parser.middleware";
import passport from "passport";
import { configurePassport } from "./config/passport";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { NoteService } from "./services/note.service";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const socketService = new SocketService(server);

// Initialize services with socketService
// Make socketService globally available
declare global {
  namespace Express {
    interface Request {
      socketService?: SocketService;
    }
  }
}

// Middleware to attach socketService to request
app.use((req, res, next) => {
  req.socketService = socketService;
  next();
});

// Basic middleware
app.use(cors());

// Custom raw body parser - must be before bodyParser.json()
app.use(rawBodyParser);

// Standard body parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use(requestLogger);

// Serve static files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Initialize Passport
app.use(passport.initialize());
configurePassport();

// API routes
app.use("/api", routes);

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      // Continue without db
    }

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`Socket.IO server is running`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
