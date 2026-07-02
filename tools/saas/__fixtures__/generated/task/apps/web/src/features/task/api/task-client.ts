import type { ApiClient } from "@/src/lib/api/api-client";
import { taskRecordSchema } from "@/src/features/task/domain/schemas";
import { z } from "zod";
const taskListResponseSchema = z.object({
  items: z.array(taskRecordSchema)
});
export function createResourceClient(apiClient: ApiClient) {
  return {
    async create(organizationId: string, body: Record<string, unknown>) {
      return taskRecordSchema.parse(
        await apiClient.request({
          body,
          method: "POST",
          path: `/api/v1/organizations/${organizationId}/tasks` as never
        })
      );
    },
    async get(organizationId: string, id: string) {
      return taskRecordSchema.parse(
        await apiClient.request({
          path: `/api/v1/organizations/${organizationId}/tasks/${id}` as never
        })
      );
    },
    async list(organizationId: string) {
      return taskListResponseSchema.parse(
        await apiClient.request({
          path: `/api/v1/organizations/${organizationId}/tasks` as never
        })
      );
    },
    async update(organizationId: string, id: string, body: Record<string, unknown>) {
      return taskRecordSchema.parse(
        await apiClient.request({
          body,
          method: "PATCH",
          path: `/api/v1/organizations/${organizationId}/tasks/${id}` as never
        })
      );
    },
  };
}
