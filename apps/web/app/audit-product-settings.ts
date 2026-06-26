import { auditTrailProduct } from "@auditrail/domain/audit-events";

import type { WorkspaceSettingsProductCopy } from "@/src/features/organizations/components/workspace-settings-screen.types";

export function getAuditTrailWorkspaceSettingsProductCopy(): WorkspaceSettingsProductCopy {
  return auditTrailProduct.workspaceSettings;
}
