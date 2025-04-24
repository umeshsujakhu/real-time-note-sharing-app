import { AppDataSource } from "../config/database";
import { Todo } from "../models/Todo";
import { User } from "../models/User";
import { CreateTodoDto, UpdateTodoDto } from "../dtos/todo.dto";

const todoRepository = AppDataSource.getRepository(Todo);
const userRepository = AppDataSource.getRepository(User);

export class TodoService {
  /**
   * Create a new todo
   */
  async createTodo(userId: string, todoData: CreateTodoDto): Promise<Todo> {
    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error("User not found");
    }

    const todo = todoRepository.create({
      text: todoData.text,
      user,
      userId,
    });

    await todoRepository.save(todo);
    return todo;
  }

  /**
   * Get all todos for a user
   */
  async getUserTodos(userId: string): Promise<Todo[]> {
    return todoRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Get a todo by ID
   */
  async getTodoById(todoId: string, userId: string): Promise<Todo> {
    const todo = await todoRepository.findOne({
      where: { id: todoId },
    });

    if (!todo) {
      throw new Error("Todo not found");
    }

    // Check if user owns this todo
    if (todo.userId !== userId) {
      throw new Error("You do not have permission to access this todo");
    }

    return todo;
  }

  /**
   * Update a todo
   */
  async updateTodo(
    todoId: string,
    userId: string,
    updateData: UpdateTodoDto
  ): Promise<Todo> {
    const todo = await this.getTodoById(todoId, userId);

    // Update todo
    Object.assign(todo, updateData);
    await todoRepository.save(todo);

    return todo;
  }

  /**
   * Delete a todo
   */
  async deleteTodo(todoId: string, userId: string): Promise<void> {
    const todo = await this.getTodoById(todoId, userId);
    await todoRepository.remove(todo);
  }
}
