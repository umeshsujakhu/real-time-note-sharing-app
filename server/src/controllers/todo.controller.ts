import { Request, Response } from "express";
import { TodoService } from "../services/todo.service";
import { CreateTodoSchema, UpdateTodoSchema } from "../dtos/todo.dto";

const todoService = new TodoService();

/**
 * @swagger
 * /api/todos:
 *   post:
 *     summary: Create a new todo
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Todo text
 *     responses:
 *       201:
 *         description: Todo created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
export const createTodo = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const parseResult = CreateTodoSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid input",
        errors: parseResult.error.errors,
      });
    }

    const todo = await todoService.createTodo(
      req.currentUser.userId,
      parseResult.data
    );

    return res.status(201).json({
      success: true,
      message: "Todo created successfully",
      data: todo,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create todo";
    return res.status(400).json({
      success: false,
      message,
    });
  }
};

/**
 * @swagger
 * /api/todos:
 *   get:
 *     summary: Get all todos for the current user
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of todos
 *       401:
 *         description: Unauthorized
 */
export const getUserTodos = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const todos = await todoService.getUserTodos(req.currentUser.userId);

    return res.status(200).json({
      success: true,
      message: "Todos retrieved successfully",
      data: todos,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve todos";
    return res.status(400).json({
      success: false,
      message,
    });
  }
};

/**
 * @swagger
 * /api/todos/{id}:
 *   get:
 *     summary: Get a todo by ID
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Todo ID
 *     responses:
 *       200:
 *         description: Todo retrieved successfully
 *       404:
 *         description: Todo not found
 *       401:
 *         description: Unauthorized
 */
export const getTodoById = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;
    const todo = await todoService.getTodoById(id, req.currentUser.userId);

    return res.status(200).json({
      success: true,
      message: "Todo retrieved successfully",
      data: todo,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve todo";
    return res.status(400).json({
      success: false,
      message,
    });
  }
};

/**
 * @swagger
 * /api/todos/{id}:
 *   patch:
 *     summary: Update a todo
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Todo ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: Todo text
 *               completed:
 *                 type: boolean
 *                 description: Todo completion status
 *     responses:
 *       200:
 *         description: Todo updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Todo not found
 *       401:
 *         description: Unauthorized
 */
export const updateTodo = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;

    const parseResult = UpdateTodoSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid input",
        errors: parseResult.error.errors,
      });
    }

    const todo = await todoService.updateTodo(
      id,
      req.currentUser.userId,
      parseResult.data
    );

    return res.status(200).json({
      success: true,
      message: "Todo updated successfully",
      data: todo,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update todo";
    return res.status(400).json({
      success: false,
      message,
    });
  }
};

/**
 * @swagger
 * /api/todos/{id}:
 *   delete:
 *     summary: Delete a todo
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Todo ID
 *     responses:
 *       200:
 *         description: Todo deleted successfully
 *       404:
 *         description: Todo not found
 *       401:
 *         description: Unauthorized
 */
export const deleteTodo = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;
    await todoService.deleteTodo(id, req.currentUser.userId);

    return res.status(200).json({
      success: true,
      message: "Todo deleted successfully",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete todo";
    return res.status(400).json({
      success: false,
      message,
    });
  }
};
