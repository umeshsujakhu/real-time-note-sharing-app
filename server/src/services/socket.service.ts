import { Server, Socket } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { Note } from "../models/Note";
import { User } from "../models/User";
import { NoteService } from "./note.service";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  currentRooms: Set<string>;
}

interface ContentChange {
  noteId: string;
  content: string;
  title?: string;
  cursorPosition?: {
    userId: string;
    position: number;
  };
}

type NoteServiceFactory = () => NoteService;

export class SocketService {
  private io: Server;
  private getNoteService: NoteServiceFactory;
  private activeUsers: Map<string, Set<string>> = new Map(); // noteId -> Set of userIds
  private userRooms: Record<string, string> = {}; // userId -> roomName

  constructor(server: http.Server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    // Create a factory function that will be used to get a NoteService instance
    // This breaks the circular dependency
    this.getNoteService = () => new NoteService();

    this.initialize();
  }

  private initialize() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error"));
      }

      try {
        // @ts-ignore - JWT verify typing issue
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "your_jwt_secret_key"
        ) as {
          userId: string;
        };

        socket.userId = decoded.userId;
        socket.currentRooms = new Set();
        next();
      } catch (error) {
        next(new Error("Authentication error"));
      }
    });

    this.io.on("connection", (socket: AuthenticatedSocket) => {
      console.log(`User connected: ${socket.userId}`);

      // Join user to their personal room for direct messaging
      if (socket.userId) {
        const userRoom = `user:${socket.userId}`;
        socket.join(userRoom);
        console.log(
          `User ${socket.userId} joined their personal room: ${userRoom}`
        );
        this.userRooms[socket.userId] = userRoom;
      }

      // Join a note room
      socket.on("join-note", async (noteId: string) => {
        try {
          if (!socket.userId) {
            socket.emit("error", { message: "Authentication required" });
            return;
          }

          // Verify user has access to this note
          try {
            const noteService = this.getNoteService();
            await noteService.getNoteById(noteId, socket.userId);
          } catch (error) {
            socket.emit("error", {
              message: "You do not have access to this note",
            });
            return;
          }

          // Add user to note room
          const roomName = `note:${noteId}`;
          socket.join(roomName);
          socket.currentRooms.add(roomName);

          // Track active users in this note
          if (!this.activeUsers.has(noteId)) {
            this.activeUsers.set(noteId, new Set());
          }
          this.activeUsers.get(noteId)?.add(socket.userId);

          // Notify other users in the room
          socket.to(roomName).emit("user-joined", {
            userId: socket.userId,
            activeUsers: Array.from(this.activeUsers.get(noteId) || []),
          });

          // Send current active users to this user
          socket.emit("active-users", {
            noteId,
            activeUsers: Array.from(this.activeUsers.get(noteId) || []),
          });

          console.log(`User ${socket.userId} joined note ${noteId}`);
        } catch (error) {
          console.error("Error joining note:", error);
          socket.emit("error", { message: "Failed to join note" });
        }
      });

      // Leave a note room
      socket.on("leave-note", (noteId: string) => {
        const roomName = `note:${noteId}`;

        if (socket.currentRooms.has(roomName)) {
          socket.leave(roomName);
          socket.currentRooms.delete(roomName);

          // Remove user from active users for this note
          if (socket.userId && this.activeUsers.has(noteId)) {
            this.activeUsers.get(noteId)?.delete(socket.userId);

            // Notify other users
            socket.to(roomName).emit("user-left", {
              userId: socket.userId,
              activeUsers: Array.from(this.activeUsers.get(noteId) || []),
            });
          }

          console.log(`User ${socket.userId} left note ${noteId}`);
        }
      });

      // Content changes
      socket.on("content-change", async (change: ContentChange) => {
        try {
          const { noteId, content, title, cursorPosition } = change;
          const roomName = `note:${noteId}`;

          if (!socket.userId) {
            socket.emit("error", { message: "Authentication required" });
            return;
          }

          // Only broadcast if user is in the room
          if (socket.currentRooms.has(roomName)) {
            // Broadcast changes to all clients except sender
            socket.to(roomName).emit("content-update", {
              noteId,
              content,
              title,
              cursorPosition,
              userId: socket.userId,
              timestamp: new Date(),
            });

            // Save changes if debounced (can be implemented with a flag in the change object)
            if (change.title) {
              try {
                const noteService = this.getNoteService();
                await noteService.updateNote(noteId, socket.userId, {
                  content,
                  title,
                });
              } catch (error) {
                console.error("Error saving note:", error);
                socket.emit("error", { message: "Failed to save note" });
              }
            }
          }
        } catch (error) {
          console.error("Error handling content change:", error);
          socket.emit("error", { message: "Failed to process content change" });
        }
      });

      // Cursor position update
      socket.on(
        "cursor-position",
        (data: { noteId: string; position: number }) => {
          const { noteId, position } = data;
          const roomName = `note:${noteId}`;

          if (!socket.userId) {
            socket.emit("error", { message: "Authentication required" });
            return;
          }

          // Only broadcast if user is in the room
          if (socket.currentRooms.has(roomName)) {
            socket.to(roomName).emit("cursor-update", {
              userId: socket.userId,
              position,
              timestamp: new Date(),
            });
          }
        }
      );

      // Disconnect
      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.userId}`);

        if (socket.userId) {
          // Remove user from all active note rooms
          for (const roomName of socket.currentRooms) {
            const noteId = roomName.split(":")[1];

            if (this.activeUsers.has(noteId)) {
              this.activeUsers.get(noteId)?.delete(socket.userId);

              // Notify other users
              socket.to(roomName).emit("user-left", {
                userId: socket.userId,
                activeUsers: Array.from(this.activeUsers.get(noteId) || []),
              });
            }
          }
        }
      });
    });
  }

  /**
   * Notify users about a note being shared with them
   */
  public notifyNoteShared(userId: string, noteId: string, sharerName: string) {
    this.io.to(`user:${userId}`).emit("note-shared", {
      noteId,
      sharedBy: sharerName,
    });
  }

  /**
   * Send a notification to a specific user
   */
  public sendUserNotification(
    userId: string,
    message: string,
    data?: any
  ): void {
    if (this.userRooms[userId]) {
      this.io
        .to(this.userRooms[userId])
        .emit("notification", { message, ...data });
    }
  }

  /**
   * Broadcast a share update event to all clients
   * Used to notify users when a share is created, accepted, or revoked
   */
  broadcastShareUpdate(data: {
    noteId: string;
    shareId: string;
    revoked?: boolean;
    share?: any;
  }): void {
    this.io.emit("share:updated", data);
  }
}
