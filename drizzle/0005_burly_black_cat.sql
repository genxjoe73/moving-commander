CREATE TABLE "employee_compensation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"employee_id" text NOT NULL,
	"pay_type" text DEFAULT 'hourly' NOT NULL,
	"base_rate" numeric(12, 2) DEFAULT '0' NOT NULL,
	"overtime_multiplier" numeric(6, 3) DEFAULT '1.5' NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_time_log" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"employee_id" text NOT NULL,
	"job_id" text,
	"pay_code" text DEFAULT 'regular' NOT NULL,
	"clock_in" timestamp with time zone NOT NULL,
	"clock_out" timestamp with time zone,
	"status" text DEFAULT 'submitted' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employee_compensation" ADD CONSTRAINT "employee_compensation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_compensation" ADD CONSTRAINT "employee_compensation_employee_id_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_time_log" ADD CONSTRAINT "employee_time_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_time_log" ADD CONSTRAINT "employee_time_log_employee_id_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_time_log" ADD CONSTRAINT "employee_time_log_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employee_compensation_organization_idx" ON "employee_compensation" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_compensation_employee_uidx" ON "employee_compensation" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_time_log_organization_idx" ON "employee_time_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "employee_time_log_employee_idx" ON "employee_time_log" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_time_log_job_idx" ON "employee_time_log" USING btree ("job_id");