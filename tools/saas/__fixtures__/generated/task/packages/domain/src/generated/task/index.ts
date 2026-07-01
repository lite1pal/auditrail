import { z } from "zod";

export const taskFieldSchema = z.object({
  title: z.string().trim().min(1),
  status: z.enum(["todo", "in_progress", "done"]),
  dueAt: z.string().datetime().optional(),
  projectId: z.string().uuid(),
  assigneeId: z.string().uuid().optional()
});

export const taskRecordSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  title: z.string().trim().min(1),
  status: z.enum(["todo", "in_progress", "done"]),
  dueAt: z.string().datetime().optional(),
  projectId: z.string().uuid(),
  assigneeId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const createTaskInputSchema = z.object({
  title: z.string().trim().min(1),
  status: z.enum(["todo", "in_progress", "done"]),
  dueAt: z.string().datetime().optional(),
  projectId: z.string().uuid(),
  assigneeId: z.string().uuid().optional()
});

export const updateTaskInputSchema = z.object({
  title: z.string().trim().min(1).optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  dueAt: z.string().datetime().optional(),
  projectId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional()
});

export const listTasksInputSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.number().int().positive().max(100).optional(),
  query: z.string().trim().min(1).optional()
});

export type TaskRecord = z.infer<typeof taskRecordSchema>;
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;
export type ListTasksInput = z.infer<typeof listTasksInputSchema>;
