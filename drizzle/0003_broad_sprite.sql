CREATE TABLE "employee" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"role" text DEFAULT 'mover' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"legacy_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_employee_assignment" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"job_id" text NOT NULL,
	"employee_id" text NOT NULL,
	"role" text DEFAULT 'mover' NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_truck_assignment" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"job_id" text NOT NULL,
	"truck_id" text NOT NULL,
	"role" text DEFAULT 'primary' NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "truck" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"unit_number" text NOT NULL,
	"truck_type" text DEFAULT 'moving truck' NOT NULL,
	"capacity" text,
	"active" boolean DEFAULT true NOT NULL,
	"legacy_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employee" ADD CONSTRAINT "employee_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_employee_assignment" ADD CONSTRAINT "job_employee_assignment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_employee_assignment" ADD CONSTRAINT "job_employee_assignment_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_employee_assignment" ADD CONSTRAINT "job_employee_assignment_employee_id_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_truck_assignment" ADD CONSTRAINT "job_truck_assignment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_truck_assignment" ADD CONSTRAINT "job_truck_assignment_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_truck_assignment" ADD CONSTRAINT "job_truck_assignment_truck_id_truck_id_fk" FOREIGN KEY ("truck_id") REFERENCES "public"."truck"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "truck" ADD CONSTRAINT "truck_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employee_organization_idx" ON "employee" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_organization_legacy_uidx" ON "employee" USING btree ("organization_id","legacy_id");--> statement-breakpoint
CREATE INDEX "job_employee_assignment_organization_idx" ON "job_employee_assignment" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "job_employee_assignment_job_employee_uidx" ON "job_employee_assignment" USING btree ("job_id","employee_id");--> statement-breakpoint
CREATE INDEX "job_truck_assignment_organization_idx" ON "job_truck_assignment" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "job_truck_assignment_job_truck_uidx" ON "job_truck_assignment" USING btree ("job_id","truck_id");--> statement-breakpoint
CREATE INDEX "truck_organization_idx" ON "truck" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "truck_organization_unit_uidx" ON "truck" USING btree ("organization_id","unit_number");--> statement-breakpoint
CREATE UNIQUE INDEX "truck_organization_legacy_uidx" ON "truck" USING btree ("organization_id","legacy_id");