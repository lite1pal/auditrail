import type { ApiClient } from "@/src/lib/api/api-client";
import { todoRecordSchema } from "@/src/features/todo/domain/schemas";
import { z } from "zod";
const todoListResponseSchema = z.object({
  items: z.array(todoRecordSchema)
});
export function createResourceClient(apiClient: ApiClient) {
  return {
    async create(organizationId: string, body: Record<string, unknown>) {
      return todoRecordSchema.parse(
        await apiClient.request({
          body,
          method: "POST",
          path: `/api/v1/organizations/${organizationId}/todos` as never
        })
      );
    },
    async get(organizationId: string, id: string) {
      return todoRecordSchema.parse(
        await apiClient.request({
          path: `/api/v1/organizations/${organizationId}/todos/${id}` as never
        })
      );
    },
    async list(organizationId: string, options?: { archived?: "exclude" | "include" | "only" }) {
      return todoListResponseSchema.parse(
        await apiClient.request({
          path: `/api/v1/organizations/${organizationId}/todos${buildArchiveQuery(options?.archived)}` as never
        })
      );
    },
    async update(organizationId: string, id: string, body: Record<string, unknown>) {
      return todoRecordSchema.parse(
        await apiClient.request({
          body,
          method: "PATCH",
          path: `/api/v1/organizations/${organizationId}/todos/${id}` as never
        })
      );
    },
    async archive(organizationId: string, id: string) {
      return todoRecordSchema.parse(
        await apiClient.request({
          method: "POST",
          path: `/api/v1/organizations/${organizationId}/todos/${id}/archive` as never
        })
      );
    },
    async unarchive(organizationId: string, id: string) {
      return todoRecordSchema.parse(
        await apiClient.request({
          method: "POST",
          path: `/api/v1/organizations/${organizationId}/todos/${id}/unarchive` as never
        })
      );
    }
  };
}

function buildArchiveQuery(archived?: "exclude" | "include" | "only") {
  if (!archived) {
    return "";
  }

  return `?${new URLSearchParams({ archived }).toString()}`;
}
