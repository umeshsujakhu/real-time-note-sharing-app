import { Router } from "express";
import {
  createTodo,
  getUserTodos,
  getTodoById,
  updateTodo,
  deleteTodo,
} from "../controllers/todo.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate as any);

// CRUD operations
router.post("/", createTodo as any);
router.get("/", getUserTodos as any);
router.get("/:id", getTodoById as any);
router.patch("/:id", updateTodo as any);
router.delete("/:id", deleteTodo as any);

export default router;
