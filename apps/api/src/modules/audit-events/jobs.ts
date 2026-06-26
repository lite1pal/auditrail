import type { AuditEventRecord, AuditEventTenant } from "./repo.js";

export interface AuditEventCreatedJobPayload {
  createdAt: string;
  eventId: string;
  organizationId: string;
  projectId: string;
}

export interface AuditEventCreatedJob {
  name: "audit-event.created";
  payload: AuditEventCreatedJobPayload;
}

export function createAuditEventCreatedJob(input: {
  event: AuditEventRecord;
  tenant: AuditEventTenant;
}): AuditEventCreatedJob {
  return {
    name: "audit-event.created",
    payload: {
      createdAt: input.event.createdAt,
      eventId: input.event.id,
      organizationId: input.tenant.organizationId,
      projectId: input.tenant.projectId
    }
  };
}
