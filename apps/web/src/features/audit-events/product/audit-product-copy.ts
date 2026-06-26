import { auditTrailProduct } from "@auditrail/domain/audit-events";

export function getAuditEventsCopy() {
  return auditTrailProduct.auditEvents;
}
