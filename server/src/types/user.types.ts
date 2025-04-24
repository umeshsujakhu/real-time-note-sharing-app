import { z } from "zod";
import { UserRole, AuthProvider } from "../models/User";

// Zod schema for user registration
export const registerUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

// Zod schema for user login
export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

// Zod schema for user update
export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).max(100).optional(),
  role: z.nativeEnum(UserRole).optional(),
});

// Infer types from schemas
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// User response type (what's sent back to clients)
export type UserResponse = {
  id: string;
  name: string;
  email: string;
  profilePicture: string | null;
  role: UserRole;
  provider: AuthProvider;
  createdAt: Date;
  updatedAt: Date;
};
