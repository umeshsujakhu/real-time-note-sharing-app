import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "../models/User";
import { Note } from "../models/Note";
import { NoteRevision } from "../models/NoteRevision";
import { NoteShare } from "../models/NoteShare";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "node_boilerplate",
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development",
  entities: [User, Note, NoteRevision, NoteShare],
  subscribers: [],
  migrations: [],
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    if (!process.env.DB_HOST || !process.env.DB_NAME) {
      console.warn(
        "Database configuration missing. Starting without database."
      );
      return;
    }

    console.log("Attempting to connect to database...");
    await AppDataSource.initialize();
    console.log("Database connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    console.warn(
      "Starting server without database. Features requiring database will not work."
    );
    // Don't throw the error - let the application continue without DB
  }
};
