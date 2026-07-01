import { z } from "zod";

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

export type TaskRecord = z.infer<typeof taskRecordSchema>;
