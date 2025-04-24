import { User } from "../models/User";
import { AppDataSource } from "../config/database";
import { UpdateUserInput, UserResponse } from "../types/user.types";
import fs from "fs";
import path from "path";

const userRepository = AppDataSource.getRepository(User);

export class UserService {
  /**
   * Get all users
   */
  async getAllUsers(): Promise<UserResponse[]> {
    const users = await userRepository.find();
    return users.map((user) => {
      const { password, ...userResponse } = user;
      return userResponse as UserResponse;
    });
  }

  /**
   * Get user by id
   */
  async getUserById(id: string): Promise<UserResponse> {
    const user = await userRepository.findOne({ where: { id } });

    if (!user) {
      throw new Error("User not found");
    }

    const { password, ...userResponse } = user;
    return userResponse as UserResponse;
  }

  /**
   * Update user
   */
  async updateUser(
    id: string,
    userData: UpdateUserInput
  ): Promise<UserResponse> {
    const user = await userRepository.findOne({ where: { id } });

    if (!user) {
      throw new Error("User not found");
    }

    // Update user fields
    Object.assign(user, userData);

    await userRepository.save(user);

    const { password, ...userResponse } = user;
    return userResponse as UserResponse;
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    const user = await userRepository.findOne({ where: { id } });

    if (!user) {
      throw new Error("User not found");
    }

    // Delete profile picture if exists
    if (user.profilePicture) {
      try {
        const filePath = path.join(process.cwd(), user.profilePicture);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error("Error deleting profile picture:", error);
      }
    }

    await userRepository.remove(user);
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(
    id: string,
    file: Express.Multer.File
  ): Promise<UserResponse> {
    const user = await userRepository.findOne({ where: { id } });

    if (!user) {
      throw new Error("User not found");
    }

    // Delete old profile picture if exists
    if (user.profilePicture) {
      try {
        const filePath = path.join(process.cwd(), user.profilePicture);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error("Error deleting old profile picture:", error);
      }
    }

    // Set new profile picture path relative to server
    user.profilePicture = `/uploads/profile/${file.filename}`;

    await userRepository.save(user);

    const { password, ...userResponse } = user;
    return userResponse as UserResponse;
  }
}
