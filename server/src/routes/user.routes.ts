import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { updateUserSchema } from "../types/user.types";
import { profileUpload } from "../middlewares/upload.middleware";
import { UserRole } from "../models/User";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate as any);

// Get all users - admin only
router.get(
  "/",
  authorize(UserRole.ADMIN) as any,
  userController.getAllUsers as any
);

// Get user by ID
router.get("/:id", userController.getUserById as any);

// Update user
router.put(
  "/:id",
  validate(updateUserSchema) as any,
  userController.updateUser as any
);

// Delete user
router.delete("/:id", userController.deleteUser as any);

// Upload profile picture
router.post(
  "/:id/profile-picture",
  profileUpload.single("profile"),
  userController.uploadProfilePicture as any
);

export default router;
