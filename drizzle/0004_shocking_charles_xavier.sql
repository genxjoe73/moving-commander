CREATE TABLE "job_charge" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"job_id" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_damage" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"job_id" text NOT NULL,
	"description" text NOT NULL,
	"location" text,
	"status" text DEFAULT 'reported' NOT NULL,
	"estimated_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_note" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"job_id" text NOT NULL,
	"author_user_id" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_stop" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"job_id" text NOT NULL,
	"sequence" integer DEFAULT 1 NOT NULL,
	"stop_type" text DEFAULT 'pickup' NOT NULL,
	"address" text NOT NULL,
	"scheduled_arrival" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_charge" ADD CONSTRAINT "job_charge_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_charge" ADD CONSTRAINT "job_charge_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_damage" ADD CONSTRAINT "job_damage_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_damage" ADD CONSTRAINT "job_damage_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_note" ADD CONSTRAINT "job_note_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_note" ADD CONSTRAINT "job_note_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_note" ADD CONSTRAINT "job_note_author_user_id_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_stop" ADD CONSTRAINT "job_stop_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_stop" ADD CONSTRAINT "job_stop_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_charge_organization_idx" ON "job_charge" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "job_charge_job_idx" ON "job_charge" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_damage_organization_idx" ON "job_damage" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "job_damage_job_idx" ON "job_damage" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_note_organization_idx" ON "job_note" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "job_note_job_idx" ON "job_note" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_stop_organization_idx" ON "job_stop" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "job_stop_job_idx" ON "job_stop" USING btree ("job_id");