CREATE TABLE "crew" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"leader_name" text,
	"active" boolean DEFAULT true NOT NULL,
	"legacy_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_contract" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"job_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"document_url" text,
	"signed_at" timestamp with time zone,
	"terms_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_crew_assignment" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"job_id" text NOT NULL,
	"crew_id" text NOT NULL,
	"role" text DEFAULT 'assigned' NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_payment" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"job_id" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"method" text DEFAULT 'unrecorded' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reference" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storage_item" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"storage_record_id" text NOT NULL,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"condition" text,
	"barcode" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storage_record" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"job_id" text,
	"customer_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"location" text,
	"entry_date" timestamp with time zone,
	"exit_date" timestamp with time zone,
	"monthly_rate" numeric(14, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crew" ADD CONSTRAINT "crew_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_contract" ADD CONSTRAINT "job_contract_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_contract" ADD CONSTRAINT "job_contract_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_crew_assignment" ADD CONSTRAINT "job_crew_assignment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_crew_assignment" ADD CONSTRAINT "job_crew_assignment_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_crew_assignment" ADD CONSTRAINT "job_crew_assignment_crew_id_crew_id_fk" FOREIGN KEY ("crew_id") REFERENCES "public"."crew"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_payment" ADD CONSTRAINT "job_payment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_payment" ADD CONSTRAINT "job_payment_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_item" ADD CONSTRAINT "storage_item_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_item" ADD CONSTRAINT "storage_item_storage_record_id_storage_record_id_fk" FOREIGN KEY ("storage_record_id") REFERENCES "public"."storage_record"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_record" ADD CONSTRAINT "storage_record_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_record" ADD CONSTRAINT "storage_record_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_record" ADD CONSTRAINT "storage_record_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "crew_organization_idx" ON "crew" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "crew_organization_name_uidx" ON "crew" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "job_contract_organization_idx" ON "job_contract" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "job_contract_job_uidx" ON "job_contract" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_crew_assignment_organization_idx" ON "job_crew_assignment" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "job_crew_assignment_job_crew_uidx" ON "job_crew_assignment" USING btree ("job_id","crew_id");--> statement-breakpoint
CREATE INDEX "job_payment_organization_idx" ON "job_payment" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "job_payment_job_idx" ON "job_payment" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "storage_item_organization_idx" ON "storage_item" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "storage_item_record_idx" ON "storage_item" USING btree ("storage_record_id");--> statement-breakpoint
CREATE INDEX "storage_record_organization_idx" ON "storage_record" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "storage_record_job_idx" ON "storage_record" USING btree ("job_id");