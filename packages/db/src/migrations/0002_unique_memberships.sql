DELETE FROM organization_memberships duplicate
USING organization_memberships original
WHERE duplicate.organization_id = original.organization_id
  AND duplicate.user_id = original.user_id
  AND duplicate.created_at > original.created_at;
--> statement-breakpoint
CREATE UNIQUE INDEX "organization_memberships_org_user_unique"
ON "organization_memberships" USING btree ("organization_id", "user_id");
