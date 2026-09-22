CREATE TABLE "job_invoice" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"job_id" text NOT NULL,
	"invoice_number" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"subtotal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"tax" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"due_date" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_invoice" ADD CONSTRAINT "job_invoice_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_invoice" ADD CONSTRAINT "job_invoice_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_invoice_organization_idx" ON "job_invoice" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "job_invoice_job_uidx" ON "job_invoice" USING btree ("job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "job_invoice_organization_number_uidx" ON "job_invoice" USING btree ("organization_id","invoice_number");