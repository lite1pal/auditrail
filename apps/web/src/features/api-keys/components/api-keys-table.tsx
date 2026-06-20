import { Card } from "@/src/components/ui/card";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ApiKeyTableRow } from "@/src/features/api-keys/components/api-key-table-row";
import type { ManagedApiKey } from "@/src/features/api-keys/domain/schemas";

interface ApiKeysTableProps {
  apiKeys: ManagedApiKey[];
  canManage?: boolean;
  currentUserEmail: string;
  newApiKey?: {
    name: string;
    projectId: string;
    rawKey: string;
  };
  organizationId?: string;
  projectId?: string;
  revokeApiKeyAction: (input: {
    apiKeyId: string;
    organizationId: string;
    projectId: string;
    redirectTo?: "/api-keys" | "/settings";
  }) => Promise<void>;
}

export function ApiKeysTable({
  apiKeys,
  canManage,
  currentUserEmail,
  newApiKey,
  organizationId,
  projectId,
  revokeApiKeyAction
}: ApiKeysTableProps) {
  if (apiKeys.length === 0) {
    return <EmptyState label="No API keys yet for the selected project." />;
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse">
          <thead>
            <tr>
              {headers.map((header) => (
                <th
                  className="border-b border-[var(--border)] bg-[var(--panel-subtle)] p-4 text-left text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]"
                  key={header}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {apiKeys.map((apiKey) => (
              <ApiKeyTableRow
                apiKey={apiKey}
                canManage={canManage}
                currentUserEmail={currentUserEmail}
                key={apiKey.id}
                newApiKey={newApiKey}
                organizationId={organizationId}
                projectId={projectId}
                revokeApiKeyAction={revokeApiKeyAction}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

const headers = [
  "Name",
  "Status",
  "Tracking ID",
  "Secret Key",
  "Created",
  "Last used",
  "Created by",
  "Actions"
];
