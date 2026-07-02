import type { TaskRecord } from "@auditrail/domain/generated/task";
import { taskTable } from "@auditrail/db/schema";
import { and, desc, eq, ilike, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import type { AppDatabase } from "../../../plugins/database.js";
import type { TaskRepo } from "./repo.js";
export function createPostgresTaskRepo(db: AppDatabase): TaskRepo {
  return {
    async create(input) {
      const [record] = await db.insert(taskTable).values({
        organizationId: input.organizationId,
        title: input.data.title,
        status: input.data.status,
        dueAt: input.data.dueAt ? new Date(input.data.dueAt) : undefined,
        projectId: input.data.projectId,
        assigneeId: input.data.assigneeId,
      }).returning();
      return toTaskRecord(record);
    },
    async findById(input) {
      const [record] = await db.select().from(taskTable).where(
        and(
          eq(taskTable.id, input.id),
          eq(taskTable.organizationId, input.organizationId)
        )
      ).limit(1);
      return record ? toTaskRecord(record) : undefined;
    },
    async list(input) {
      const limit = Math.min(input.filters.limit ?? 50, 100);
      const pattern = input.filters.query ? `%${input.filters.query}%` : undefined;
      const [cursorRecord] = input.filters.cursor ? await db.select({
        createdAt: taskTable.createdAt,
        id: taskTable.id
      }).from(taskTable).where(
        and(
          eq(taskTable.id, input.filters.cursor),
          eq(taskTable.organizationId, input.organizationId)
        )
      ).limit(1) : [];
      const records = await db.select().from(taskTable).where(
        and(
          eq(taskTable.organizationId, input.organizationId),
          pattern
            ? or(
      ilike(sql`cast(${taskTable.title} as text)`, pattern)
            )
            : undefined,
          cursorRecord
            ? or(
                lt(taskTable.createdAt, cursorRecord.createdAt),
                and(
                  eq(taskTable.createdAt, cursorRecord.createdAt),
                  lt(taskTable.id, cursorRecord.id)
                )
              )
            : undefined
        )
      ).orderBy(desc(taskTable.createdAt), desc(taskTable.id)).limit(limit);
      return records.map(toTaskRecord);
    },
    async update(input) {
      const [record] = await db.update(taskTable).set({
        title: input.data.title !== undefined ? input.data.title : undefined,
        status: input.data.status !== undefined ? input.data.status : undefined,
        dueAt: input.data.dueAt !== undefined ? input.data.dueAt ? new Date(input.data.dueAt) : undefined : undefined,
        projectId: input.data.projectId !== undefined ? input.data.projectId : undefined,
        assigneeId: input.data.assigneeId !== undefined ? input.data.assigneeId : undefined,
        updatedAt: new Date()
      }).where(
        and(
          eq(taskTable.id, input.id),
          eq(taskTable.organizationId, input.organizationId)
        )
      ).returning();
      return record ? toTaskRecord(record) : undefined;
    }
  };
}
function toTaskRecord(
  record: typeof taskTable.$inferSelect
): TaskRecord {
  return {
    id: record.id,
    organizationId: record.organizationId,
    title: record.title,
    status: record.status as TaskRecord["status"],
    dueAt: record.dueAt?.toISOString(),
    projectId: record.projectId,
    assigneeId: record.assigneeId ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}
