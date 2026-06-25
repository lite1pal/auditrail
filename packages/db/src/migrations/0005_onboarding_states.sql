CREATE TABLE IF NOT EXISTS "user_organization_onboarding_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_organization_onboarding_states" ADD CONSTRAINT "user_organization_onboarding_states_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_organization_onboarding_states" ADD CONSTRAINT "user_organization_onboarding_states_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_org_onboarding_states_org_id_idx" ON "user_organization_onboarding_states" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_org_onboarding_states_user_id_idx" ON "user_organization_onboarding_states" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_org_onboarding_states_org_user_unique" ON "user_organization_onboarding_states" USING btree ("organization_id","user_id");
