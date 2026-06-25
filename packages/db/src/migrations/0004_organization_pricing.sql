ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "plan_id" text NOT NULL DEFAULT 'starter';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_monthly_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"month_start" timestamp with time zone NOT NULL,
	"event_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_monthly_usage" ADD CONSTRAINT "organization_monthly_usage_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organization_monthly_usage_organization_id_idx" ON "organization_monthly_usage" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "organization_monthly_usage_org_month_unique" ON "organization_monthly_usage" USING btree ("organization_id","month_start");
