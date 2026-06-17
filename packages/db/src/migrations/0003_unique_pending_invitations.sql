UPDATE organization_invitations duplicate
SET revoked_at = now()
FROM organization_invitations newest
WHERE duplicate.organization_id = newest.organization_id
  AND duplicate.email = newest.email
  AND duplicate.accepted_at IS NULL
  AND duplicate.revoked_at IS NULL
  AND newest.accepted_at IS NULL
  AND newest.revoked_at IS NULL
  AND duplicate.created_at < newest.created_at;
--> statement-breakpoint
CREATE UNIQUE INDEX "organization_invitations_pending_org_email_unique"
ON "organization_invitations" USING btree ("organization_id", "email")
WHERE accepted_at IS NULL AND revoked_at IS NULL;
