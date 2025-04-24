import { create } from "zustand";
import api from "../services/api";

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

interface TodoState {
  todos: TodoItem[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTodos: () => Promise<void>;
  addTodo: (text: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useTodoStore = create<TodoState>()((set, get) => ({
  todos: [],
  isLoading: false,
  error: null,

  fetchTodos: async () => {
    try {
      set({ isLoading: true, error: null });

      // When the API endpoint is ready, use this:
      // const response = await api.get("/todos");
      // set({ todos: response.data.data, isLoading: false });

      // Mock data for now
      setTimeout(() => {
        set({
          todos: [
            {
              id: "1",
              text: "Complete project documentation",
              completed: false,
              createdAt: new Date().toISOString(),
            },
            {
              id: "2",
              text: "Schedule team meeting",
              completed: true,
              createdAt: new Date().toISOString(),
            },
            {
              id: "3",
              text: "Review pull requests",
              completed: false,
              createdAt: new Date().toISOString(),
            },
          ],
          isLoading: false,
        });
      }, 500);
    } catch (error: any) {
      console.error("Failed to fetch todos:", error);
      set({
        error: error.response?.data?.message || "Failed to load tasks",
        isLoading: false,
      });
    }
  },

  addTodo: async (text: string) => {
    try {
      set({ isLoading: true, error: null });

      // When the API endpoint is ready, use this:
      // const response = await api.post("/todos", { text });
      // const newTodo = response.data.data;
      // set(state => ({
      //   todos: [...state.todos, newTodo],
      //   isLoading: false
      // }));

      // Mock adding for now
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        text,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        todos: [...state.todos, newTodo],
        isLoading: false,
      }));
    } catch (error: any) {
      console.error("Failed to add todo:", error);
      set({
        error: error.response?.data?.message || "Failed to add task",
        isLoading: false,
      });
    }
  },

  toggleTodo: async (id: string) => {
    try {
      const { todos } = get();
      const todo = todos.find((t) => t.id === id);

      if (!todo) return;

      const updatedTodos = todos.map((todo) => {
        if (todo.id === id) {
          return { ...todo, completed: !todo.completed };
        }
        return todo;
      });

      set({ todos: updatedTodos });

      // When the API endpoint is ready, use this:
      // await api.patch(`/todos/${id}`, {
      //   completed: !todo.completed
      // });
    } catch (error: any) {
      console.error("Failed to toggle todo:", error);
      set({
        error: error.response?.data?.message || "Failed to update task",
      });
    }
  },

  deleteTodo: async (id: string) => {
    try {
      set((state) => ({
        todos: state.todos.filter((todo) => todo.id !== id),
      }));

      // When the API endpoint is ready, use this:
      // await api.delete(`/todos/${id}`);
    } catch (error: any) {
      console.error("Failed to delete todo:", error);
      set({
        error: error.response?.data?.message || "Failed to delete task",
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
