import type { IngestAuditEventInput } from "@auditrail/domain/audit-events";

import type {
  AuditEventListFilters,
  AuditEventRecord,
  AuditEventRepo,
  AuditEventSummary,
  AuditEventSummaryFilters,
  AuditEventTenant
} from "./repo.js";

export interface AuditEventService {
  ingest(
    tenant: AuditEventTenant,
    input: IngestAuditEventInput
  ): Promise<AuditEventRecord>;
  list(
    tenant: AuditEventTenant,
    filters: AuditEventListFilters
  ): Promise<AuditEventRecord[]>;
  summarize(
    tenant: AuditEventTenant,
    filters: AuditEventSummaryFilters
  ): Promise<AuditEventSummary>;
}

export function createAuditEventService(repo: AuditEventRepo): AuditEventService {
  return {
    ingest(tenant, input) {
      return repo.append(tenant, input);
    },
    list(tenant, filters) {
      return repo.list(tenant, filters);
    },
    summarize(tenant, filters) {
      return repo.summarize(tenant, filters);
    }
  };
}
