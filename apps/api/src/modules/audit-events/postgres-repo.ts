import { auditEvents } from "@auditrail/db/schema";
import type { IngestAuditEventInput } from "@auditrail/domain/audit-events";

import type {
  AuditEventRecord,
  AuditEventRepo,
  AuditEventTenant
} from "./repo.js";
import type { AppDatabase } from "../../plugins/database.js";

export function createPostgresAuditEventRepo(db: AppDatabase): AuditEventRepo {
  return {
    async append(tenant: AuditEventTenant, input: IngestAuditEventInput) {
      const [record] = await db
        .insert(auditEvents)
        .values({
          organizationId: tenant.organizationId,
          projectId: tenant.projectId,
          eventType: input.event,
          actorId: input.actor,
          targetId: input.target,
          metadata: input.metadata
        })
        .returning({
          id: auditEvents.id,
          eventType: auditEvents.eventType,
          actorId: auditEvents.actorId,
          targetId: auditEvents.targetId,
          metadata: auditEvents.metadata
        });

      return {
        id: record.id,
        eventType: record.eventType,
        actorId: record.actorId ?? undefined,
        targetId: record.targetId ?? undefined,
        metadata: record.metadata as Record<string, unknown>
      } satisfies AuditEventRecord;
    }
  };
}
