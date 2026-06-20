import { Button } from "@/src/components/ui/button";
import type { ManagedApiKey } from "@/src/features/api-keys/domain/schemas";

interface ApiKeyTableRowProps {
  apiKey: ManagedApiKey;
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

export function ApiKeyTableRow({
  apiKey,
  canManage,
  currentUserEmail,
  newApiKey,
  organizationId,
  projectId,
  revokeApiKeyAction
}: ApiKeyTableRowProps) {
  const isNewKey =
    newApiKey?.projectId === apiKey.projectId && newApiKey.name === apiKey.name;

  return (
    <tr className="align-top hover:bg-[var(--panel-subtle)]">
      <td className="border-b border-[var(--border)] p-4 text-sm font-medium">{apiKey.name}</td>
      <td className="border-b border-[var(--border)] p-4 text-sm">
        {apiKey.revoked ? "Revoked" : "Active"}
      </td>
      <td className="border-b border-[var(--border)] p-4 text-xs">
        <code>{apiKey.id}</code>
      </td>
      <td className="border-b border-[var(--border)] p-4 text-sm">
        {isNewKey ? newApiKey.rawKey : "Hidden after creation"}
      </td>
      <td className="border-b border-[var(--border)] p-4 text-sm">{formatDate(apiKey.createdAt)}</td>
      <td className="border-b border-[var(--border)] p-4 text-sm">
        {apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : "Never"}
      </td>
      <td className="border-b border-[var(--border)] p-4 text-sm">
        {isNewKey ? currentUserEmail : "Unavailable"}
      </td>
      <td className="border-b border-[var(--border)] p-4 text-sm">
        {!apiKey.revoked && canManage && organizationId && projectId ? (
          <form
            action={revokeApiKeyAction.bind(null, {
              apiKeyId: apiKey.id,
              organizationId,
              projectId,
              redirectTo: "/api-keys"
            })}
          >
            <Button size="sm" type="submit" variant="secondary">
              Revoke
            </Button>
          </form>
        ) : (
          "No actions"
        )}
      </td>
    </tr>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}
