CREATE TABLE "job_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 10 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "job_outbox_status_available_at_idx" ON "job_outbox" USING btree ("status","available_at");--> statement-breakpoint
CREATE INDEX "job_outbox_name_status_idx" ON "job_outbox" USING btree ("name","status");--> statement-breakpoint
CREATE INDEX "job_outbox_created_at_idx" ON "job_outbox" USING btree ("created_at");