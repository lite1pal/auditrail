CREATE TABLE "billing_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_customer_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"billing_customer_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_subscription_id" text NOT NULL,
	"provider_price_id" text NOT NULL,
	"provider_product_id" text,
	"billing_plan_id" text NOT NULL,
	"entitlement_plan_id" text NOT NULL,
	"status" text NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "billing_customers" ADD CONSTRAINT "billing_customers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_billing_customer_id_billing_customers_id_fk" FOREIGN KEY ("billing_customer_id") REFERENCES "public"."billing_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "billing_customers_organization_id_idx" ON "billing_customers" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_customers_provider_customer_unique" ON "billing_customers" USING btree ("provider","provider_customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_customers_org_provider_unique" ON "billing_customers" USING btree ("organization_id","provider");--> statement-breakpoint
CREATE INDEX "billing_subscriptions_organization_id_idx" ON "billing_subscriptions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "billing_subscriptions_customer_id_idx" ON "billing_subscriptions" USING btree ("billing_customer_id");--> statement-breakpoint
CREATE INDEX "billing_subscriptions_org_status_idx" ON "billing_subscriptions" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_subscriptions_provider_subscription_unique" ON "billing_subscriptions" USING btree ("provider","provider_subscription_id");