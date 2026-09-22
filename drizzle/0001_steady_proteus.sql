CREATE TABLE "lead_intake_token" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"created_by_user_id" text,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job" ADD COLUMN "job_type" text DEFAULT 'move' NOT NULL;--> statement-breakpoint
ALTER TABLE "job" ADD COLUMN "actual_start" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "job" ADD COLUMN "actual_end" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "job" ADD COLUMN "origin_address" text;--> statement-breakpoint
ALTER TABLE "job" ADD COLUMN "destination_address" text;--> statement-breakpoint
ALTER TABLE "job" ADD COLUMN "crew_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "job" ADD COLUMN "truck_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "job" ADD COLUMN "dispatch_notes" text;--> statement-breakpoint
ALTER TABLE "job" ADD COLUMN "contract_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "job" ADD COLUMN "payment_status" text DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "job" ADD COLUMN "estimated_total" numeric(14, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "pricing_model" text DEFAULT 'local_hourly' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "tariff_rule" text DEFAULT 'local_max_2018' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "quote_date" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "from_city" text;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "from_state" text;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "from_postal_code" text;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "to_city" text;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "to_state" text;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "to_postal_code" text;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "estimated_hours" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "foreman_count" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "mover_count" numeric(10, 2) DEFAULT '1' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "truck_count" numeric(10, 2) DEFAULT '1' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "equipment_count" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "estimated_weight" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "trip_miles" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "hourly_rate" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "trip_rate" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "trip_charge" numeric(14, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "flat_rate_amount" numeric(14, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "discount_percent" numeric(7, 3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "surcharge_percent" numeric(7, 3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "sales_tax_percent" numeric(7, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "sales_tax" numeric(14, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "tax_exempt" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "override_trip_charge" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "overtime" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "quote_details" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "calculation_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "total" numeric(14, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "lead_intake_token" ADD CONSTRAINT "lead_intake_token_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_intake_token" ADD CONSTRAINT "lead_intake_token_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lead_intake_token_hash_uidx" ON "lead_intake_token" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "lead_intake_token_organization_idx" ON "lead_intake_token" USING btree ("organization_id");