import { z } from "zod";

export const CreateTodoSchema = z.object({
  text: z.string().min(1, { message: "Text is required" }),
});

export const UpdateTodoSchema = z.object({
  text: z.string().min(1).optional(),
  completed: z.boolean().optional(),
});

export type CreateTodoDto = z.infer<typeof CreateTodoSchema>;
export type UpdateTodoDto = z.infer<typeof UpdateTodoSchema>;

export interface TodoResponseDto {
  id: string;
  text: string;
  completed: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
