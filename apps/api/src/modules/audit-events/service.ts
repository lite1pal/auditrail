import type { IngestAuditEventInput } from "@auditrail/domain/audit-events";
import { getPricingPlan, type PricingUsageSummary } from "@auditrail/domain/pricing";

import type {
  AuditEventListFilters,
  AuditEventRecord,
  AuditEventRepo,
  AuditEventSummary,
  AuditEventSummaryFilters,
  AuditEventTimeseriesFilters,
  AuditEventTimeseriesPoint,
  AuditEventTenant
} from "./repo.js";
import {
  defaultPlatformMeterKey,
  type PlatformEntitlementService
} from "../platform/entitlements/service.js";
import { EventQuotaExceededError } from "./repo.js";

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
  timeseries(
    tenant: AuditEventTenant,
    filters: AuditEventTimeseriesFilters
  ): Promise<AuditEventTimeseriesPoint[]>;
}

export { EventQuotaExceededError } from "./repo.js";

export function createAuditEventService(
  repo: AuditEventRepo,
  options: {
    entitlementService?: PlatformEntitlementService;
  } = {}
): AuditEventService {
  return {
    async ingest(tenant, input) {
      if (!options.entitlementService) {
        return repo.append(tenant, input);
      }

      const quotaDecision = await options.entitlementService.canConsumeMeter({
        meterKey: defaultPlatformMeterKey,
        organizationId: tenant.organizationId,
        quantity: 1
      });
      const quota = await resolveEventQuota(
        options.entitlementService,
        tenant.organizationId
      );

      if (quotaDecision.status !== "allowed") {
        throw new EventQuotaExceededError(quota);
      }

      return repo.append(tenant, input, {
        quota
      });
    },
    list(tenant, filters) {
      return repo.list(tenant, filters);
    },
    summarize(tenant, filters) {
      return repo.summarize(tenant, filters);
    },
    timeseries(tenant, filters) {
      return repo.timeseries(tenant, filters);
    }
  };
}

async function resolveEventQuota(
  entitlementService: PlatformEntitlementService,
  organizationId: string
): Promise<PricingUsageSummary> {
  const summary = await entitlementService.getEntitlementSummary(organizationId);
  const eventUsage = summary.meterUsage.find(
    (meterUsage) => meterUsage.meterKey === defaultPlatformMeterKey
  );
  const plan = getPricingPlan(summary.planId);

  return {
    id: summary.planId,
    includedEvents: eventUsage?.includedUnits ?? plan.includedEvents,
    name: plan.name,
    periodEnd: summary.periodEnd,
    periodStart: summary.periodStart,
    remainingEvents: eventUsage?.remainingUnits ?? 0,
    usedEvents: eventUsage?.usedUnits ?? 0
  };
}
