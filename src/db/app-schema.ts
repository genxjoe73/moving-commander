import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { organization, user } from "./auth-schema";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
};

export const subscriptionStatus = pgEnum("subscription_status", ["trial", "active", "past_due", "paused", "cancelled"]);
export const leadStatus = pgEnum("lead_status", ["new", "contacted", "qualified", "quoted", "won", "lost"]);
export const quoteStatus = pgEnum("quote_status", ["draft", "sent", "accepted", "declined", "expired"]);
export const jobStatus = pgEnum("job_status", ["scheduled", "dispatched", "in_progress", "completed", "cancelled"]);
export const importStatus = pgEnum("import_status", ["pending", "running", "completed", "failed"]);

export const organizationProfile = pgTable("organization_profile", {
  organizationId: text("organization_id").primaryKey().references(() => organization.id, { onDelete: "cascade" }),
  legalName: text("legal_name").notNull(),
  phone: text("phone"),
  website: text("website"),
  addressLine1: text("address_line_1"),
  addressLine2: text("address_line_2"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  dotNumber: text("dot_number"),
  stateDmvNumber: text("state_dmv_number"),
  subscriptionStatus: subscriptionStatus("subscription_status").default("trial").notNull(),
  subscriptionTier: text("subscription_tier").default("founding").notNull(),
  enabledModules: jsonb("enabled_modules").$type<string[]>().default([]).notNull(),
  branding: jsonb("branding").$type<{ logoUrl?: string; primaryColor?: string; accentColor?: string }>().default({}).notNull(),
  onboardingStep: integer("onboarding_step").default(1).notNull(),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  legacyId: text("legacy_id"),
  ...timestamps,
});

export const office = pgTable("office", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone"),
  addressLine1: text("address_line_1"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  isPrimary: boolean("is_primary").default(false).notNull(),
  legacyId: text("legacy_id"),
  ...timestamps,
}, (table) => [index("office_organization_idx").on(table.organizationId), uniqueIndex("office_organization_legacy_uidx").on(table.organizationId, table.legacyId)]);

export const leadSource = pgTable("lead_source", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sourceType: text("source_type").default("manual").notNull(),
  sourceAddress: text("source_address"),
  fieldMapping: jsonb("field_mapping").$type<Record<string, string>>().default({}).notNull(),
  active: boolean("active").default(true).notNull(),
  legacyId: text("legacy_id"),
  ...timestamps,
}, (table) => [index("lead_source_organization_idx").on(table.organizationId), uniqueIndex("lead_source_organization_name_uidx").on(table.organizationId, table.name)]);

export const lead = pgTable("lead", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  leadSourceId: text("lead_source_id").references(() => leadSource.id, { onDelete: "set null" }),
  assignedUserId: text("assigned_user_id").references(() => user.id, { onDelete: "set null" }),
  status: leadStatus("status").default("new").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  companyName: text("company_name"),
  email: text("email"),
  phone: text("phone"),
  moveDate: timestamp("move_date", { withTimezone: true }),
  originPostalCode: text("origin_postal_code"),
  destinationPostalCode: text("destination_postal_code"),
  notes: text("notes"),
  sourceMessageId: text("source_message_id"),
  legacyId: text("legacy_id"),
  ...timestamps,
}, (table) => [index("lead_organization_status_idx").on(table.organizationId, table.status), uniqueIndex("lead_organization_message_uidx").on(table.organizationId, table.sourceMessageId), uniqueIndex("lead_organization_legacy_uidx").on(table.organizationId, table.legacyId)]);

export const customer = pgTable("customer", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  leadId: text("lead_id").references(() => lead.id, { onDelete: "set null" }),
  firstName: text("first_name"),
  lastName: text("last_name"),
  companyName: text("company_name"),
  email: text("email"),
  phone: text("phone"),
  legacyId: text("legacy_id"),
  ...timestamps,
}, (table) => [index("customer_organization_idx").on(table.organizationId), uniqueIndex("customer_organization_legacy_uidx").on(table.organizationId, table.legacyId)]);

export const quote = pgTable("quote", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  customerId: text("customer_id").references(() => customer.id, { onDelete: "set null" }),
  leadId: text("lead_id").references(() => lead.id, { onDelete: "set null" }),
  quoteNumber: text("quote_number").notNull(),
  status: quoteStatus("status").default("draft").notNull(),
  pricingModel: text("pricing_model").default("local_hourly").notNull(),
  tariffRule: text("tariff_rule").default("local_max_2018").notNull(),
  moveDate: timestamp("move_date", { withTimezone: true }),
  quoteDate: timestamp("quote_date", { withTimezone: true }).defaultNow().notNull(),
  originAddress: text("origin_address"),
  destinationAddress: text("destination_address"),
  fromCity: text("from_city"),
  fromState: text("from_state"),
  fromPostalCode: text("from_postal_code"),
  toCity: text("to_city"),
  toState: text("to_state"),
  toPostalCode: text("to_postal_code"),
  estimatedHours: numeric("estimated_hours", { precision: 10, scale: 2 }).default("0").notNull(),
  foremanCount: numeric("foreman_count", { precision: 10, scale: 2 }).default("0").notNull(),
  moverCount: numeric("mover_count", { precision: 10, scale: 2 }).default("1").notNull(),
  truckCount: numeric("truck_count", { precision: 10, scale: 2 }).default("1").notNull(),
  equipmentCount: numeric("equipment_count", { precision: 10, scale: 2 }).default("0").notNull(),
  estimatedWeight: numeric("estimated_weight", { precision: 12, scale: 2 }).default("0").notNull(),
  tripMiles: numeric("trip_miles", { precision: 12, scale: 2 }).default("0").notNull(),
  hourlyRate: numeric("hourly_rate", { precision: 12, scale: 2 }).default("0").notNull(),
  tripRate: numeric("trip_rate", { precision: 12, scale: 2 }).default("0").notNull(),
  tripCharge: numeric("trip_charge", { precision: 14, scale: 2 }).default("0").notNull(),
  flatRateAmount: numeric("flat_rate_amount", { precision: 14, scale: 2 }).default("0").notNull(),
  discountPercent: numeric("discount_percent", { precision: 7, scale: 3 }).default("0").notNull(),
  surchargePercent: numeric("surcharge_percent", { precision: 7, scale: 3 }).default("0").notNull(),
  salesTaxPercent: numeric("sales_tax_percent", { precision: 7, scale: 4 }).default("0").notNull(),
  salesTax: numeric("sales_tax", { precision: 14, scale: 2 }).default("0").notNull(),
  taxExempt: boolean("tax_exempt").default(false).notNull(),
  overrideTripCharge: boolean("override_trip_charge").default(false).notNull(),
  overtime: boolean("overtime").default(false).notNull(),
  quoteDetails: jsonb("quote_details").$type<Record<string, unknown>>().default({}).notNull(),
  calculationSnapshot: jsonb("calculation_snapshot").$type<Record<string, unknown>>().default({}).notNull(),
  estimatedTotal: numeric("estimated_total", { precision: 14, scale: 2 }).default("0").notNull(),
  total: numeric("total", { precision: 14, scale: 2 }).default("0").notNull(),
  notes: text("notes"),
  legacyId: text("legacy_id"),
  ...timestamps,
}, (table) => [uniqueIndex("quote_organization_number_uidx").on(table.organizationId, table.quoteNumber), uniqueIndex("quote_organization_legacy_uidx").on(table.organizationId, table.legacyId)]);

export const leadIntakeToken = pgTable("lead_intake_token", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  createdByUserId: text("created_by_user_id").references(() => user.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  tokenHash: text("token_hash").notNull(),
  active: boolean("active").default(true).notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [uniqueIndex("lead_intake_token_hash_uidx").on(table.tokenHash), index("lead_intake_token_organization_idx").on(table.organizationId)]);

export const job = pgTable("job", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  officeId: text("office_id").references(() => office.id, { onDelete: "set null" }),
  customerId: text("customer_id").references(() => customer.id, { onDelete: "set null" }),
  quoteId: text("quote_id").references(() => quote.id, { onDelete: "set null" }),
  jobNumber: text("job_number").notNull(),
  status: jobStatus("status").default("scheduled").notNull(),
  jobType: text("job_type").default("move").notNull(),
  scheduledStart: timestamp("scheduled_start", { withTimezone: true }),
  scheduledEnd: timestamp("scheduled_end", { withTimezone: true }),
  actualStart: timestamp("actual_start", { withTimezone: true }),
  actualEnd: timestamp("actual_end", { withTimezone: true }),
  originAddress: text("origin_address"),
  destinationAddress: text("destination_address"),
  crewCount: integer("crew_count").default(0).notNull(),
  truckCount: integer("truck_count").default(0).notNull(),
  dispatchNotes: text("dispatch_notes"),
  contractStatus: text("contract_status").default("pending").notNull(),
  paymentStatus: text("payment_status").default("unpaid").notNull(),
  estimatedTotal: numeric("estimated_total", { precision: 14, scale: 2 }).default("0").notNull(),
  legacyId: text("legacy_id"),
  ...timestamps,
}, (table) => [uniqueIndex("job_organization_number_uidx").on(table.organizationId, table.jobNumber), uniqueIndex("job_organization_legacy_uidx").on(table.organizationId, table.legacyId)]);

export const crew = pgTable("crew", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  leaderName: text("leader_name"),
  active: boolean("active").default(true).notNull(),
  legacyId: text("legacy_id"),
  ...timestamps,
}, (table) => [index("crew_organization_idx").on(table.organizationId), uniqueIndex("crew_organization_name_uidx").on(table.organizationId, table.name)]);

export const jobCrewAssignment = pgTable("job_crew_assignment", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  jobId: text("job_id").notNull().references(() => job.id, { onDelete: "cascade" }),
  crewId: text("crew_id").notNull().references(() => crew.id, { onDelete: "cascade" }),
  role: text("role").default("assigned").notNull(),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
  ...timestamps,
}, (table) => [index("job_crew_assignment_organization_idx").on(table.organizationId), uniqueIndex("job_crew_assignment_job_crew_uidx").on(table.jobId, table.crewId)]);

export const employee = pgTable("employee", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role").default("mover").notNull(),
  active: boolean("active").default(true).notNull(),
  legacyId: text("legacy_id"),
  ...timestamps,
}, (table) => [index("employee_organization_idx").on(table.organizationId), uniqueIndex("employee_organization_legacy_uidx").on(table.organizationId, table.legacyId)]);

export const employeeCompensation = pgTable("employee_compensation", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  employeeId: text("employee_id").notNull().references(() => employee.id, { onDelete: "cascade" }),
  payType: text("pay_type").default("hourly").notNull(),
  baseRate: numeric("base_rate", { precision: 12, scale: 2 }).default("0").notNull(),
  overtimeMultiplier: numeric("overtime_multiplier", { precision: 6, scale: 3 }).default("1.5").notNull(),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }).defaultNow().notNull(),
  notes: text("notes"),
  ...timestamps,
}, (table) => [index("employee_compensation_organization_idx").on(table.organizationId), uniqueIndex("employee_compensation_employee_uidx").on(table.employeeId)]);

export const employeeTimeLog = pgTable("employee_time_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  employeeId: text("employee_id").notNull().references(() => employee.id, { onDelete: "cascade" }),
  jobId: text("job_id").references(() => job.id, { onDelete: "set null" }),
  payCode: text("pay_code").default("regular").notNull(),
  clockIn: timestamp("clock_in", { withTimezone: true }).notNull(),
  clockOut: timestamp("clock_out", { withTimezone: true }),
  status: text("status").default("submitted").notNull(),
  notes: text("notes"),
  ...timestamps,
}, (table) => [index("employee_time_log_organization_idx").on(table.organizationId), index("employee_time_log_employee_idx").on(table.employeeId), index("employee_time_log_job_idx").on(table.jobId)]);

export const truck = pgTable("truck", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  unitNumber: text("unit_number").notNull(),
  truckType: text("truck_type").default("moving truck").notNull(),
  capacity: text("capacity"),
  active: boolean("active").default(true).notNull(),
  legacyId: text("legacy_id"),
  ...timestamps,
}, (table) => [index("truck_organization_idx").on(table.organizationId), uniqueIndex("truck_organization_unit_uidx").on(table.organizationId, table.unitNumber), uniqueIndex("truck_organization_legacy_uidx").on(table.organizationId, table.legacyId)]);

export const jobEmployeeAssignment = pgTable("job_employee_assignment", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  jobId: text("job_id").notNull().references(() => job.id, { onDelete: "cascade" }),
  employeeId: text("employee_id").notNull().references(() => employee.id, { onDelete: "cascade" }),
  role: text("role").default("mover").notNull(),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
  ...timestamps,
}, (table) => [index("job_employee_assignment_organization_idx").on(table.organizationId), uniqueIndex("job_employee_assignment_job_employee_uidx").on(table.jobId, table.employeeId)]);

export const jobTruckAssignment = pgTable("job_truck_assignment", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  jobId: text("job_id").notNull().references(() => job.id, { onDelete: "cascade" }),
  truckId: text("truck_id").notNull().references(() => truck.id, { onDelete: "cascade" }),
  role: text("role").default("primary").notNull(),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
  ...timestamps,
}, (table) => [index("job_truck_assignment_organization_idx").on(table.organizationId), uniqueIndex("job_truck_assignment_job_truck_uidx").on(table.jobId, table.truckId)]);

export const jobStop = pgTable("job_stop", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  jobId: text("job_id").notNull().references(() => job.id, { onDelete: "cascade" }),
  sequence: integer("sequence").default(1).notNull(),
  stopType: text("stop_type").default("pickup").notNull(),
  address: text("address").notNull(),
  scheduledArrival: timestamp("scheduled_arrival", { withTimezone: true }),
  notes: text("notes"),
  ...timestamps,
}, (table) => [index("job_stop_organization_idx").on(table.organizationId), index("job_stop_job_idx").on(table.jobId)]);

export const jobNote = pgTable("job_note", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  jobId: text("job_id").notNull().references(() => job.id, { onDelete: "cascade" }),
  authorUserId: text("author_user_id").references(() => user.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  ...timestamps,
}, (table) => [index("job_note_organization_idx").on(table.organizationId), index("job_note_job_idx").on(table.jobId)]);

export const jobDamage = pgTable("job_damage", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  jobId: text("job_id").notNull().references(() => job.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  location: text("location"),
  status: text("status").default("reported").notNull(),
  estimatedAmount: numeric("estimated_amount", { precision: 14, scale: 2 }).default("0").notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [index("job_damage_organization_idx").on(table.organizationId), index("job_damage_job_idx").on(table.jobId)]);

export const jobCharge = pgTable("job_charge", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  jobId: text("job_id").notNull().references(() => job.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  status: text("status").default("pending").notNull(),
  ...timestamps,
}, (table) => [index("job_charge_organization_idx").on(table.organizationId), index("job_charge_job_idx").on(table.jobId)]);

export const jobInvoice = pgTable("job_invoice", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  jobId: text("job_id").notNull().references(() => job.id, { onDelete: "cascade" }),
  invoiceNumber: text("invoice_number").notNull(),
  status: text("status").default("draft").notNull(),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).default("0").notNull(),
  tax: numeric("tax", { precision: 14, scale: 2 }).default("0").notNull(),
  total: numeric("total", { precision: 14, scale: 2 }).default("0").notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
  notes: text("notes"),
  ...timestamps,
}, (table) => [index("job_invoice_organization_idx").on(table.organizationId), uniqueIndex("job_invoice_job_uidx").on(table.jobId), uniqueIndex("job_invoice_organization_number_uidx").on(table.organizationId, table.invoiceNumber)]);

export const jobContract = pgTable("job_contract", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  jobId: text("job_id").notNull().references(() => job.id, { onDelete: "cascade" }),
  status: text("status").default("pending").notNull(),
  documentUrl: text("document_url"),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  termsSnapshot: jsonb("terms_snapshot").$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
}, (table) => [index("job_contract_organization_idx").on(table.organizationId), uniqueIndex("job_contract_job_uidx").on(table.jobId)]);

export const jobPayment = pgTable("job_payment", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  jobId: text("job_id").notNull().references(() => job.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  method: text("method").default("unrecorded").notNull(),
  status: text("status").default("pending").notNull(),
  reference: text("reference"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [index("job_payment_organization_idx").on(table.organizationId), index("job_payment_job_idx").on(table.jobId)]);

export const storageRecord = pgTable("storage_record", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  jobId: text("job_id").references(() => job.id, { onDelete: "set null" }),
  customerId: text("customer_id").references(() => customer.id, { onDelete: "set null" }),
  status: text("status").default("active").notNull(),
  location: text("location"),
  entryDate: timestamp("entry_date", { withTimezone: true }),
  exitDate: timestamp("exit_date", { withTimezone: true }),
  monthlyRate: numeric("monthly_rate", { precision: 14, scale: 2 }).default("0").notNull(),
  notes: text("notes"),
  ...timestamps,
}, (table) => [index("storage_record_organization_idx").on(table.organizationId), index("storage_record_job_idx").on(table.jobId)]);

export const storageItem = pgTable("storage_item", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  storageRecordId: text("storage_record_id").notNull().references(() => storageRecord.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  condition: text("condition"),
  barcode: text("barcode"),
  ...timestamps,
}, (table) => [index("storage_item_organization_idx").on(table.organizationId), index("storage_item_record_idx").on(table.storageRecordId)]);

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("audit_log_organization_created_idx").on(table.organizationId, table.createdAt)]);

export const legacyImportBatch = pgTable("legacy_import_batch", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  sourceSystem: text("source_system").default("moving-commander-mvc").notNull(),
  sourceFileName: text("source_file_name"),
  status: importStatus("status").default("pending").notNull(),
  recordsRead: integer("records_read").default(0).notNull(),
  recordsImported: integer("records_imported").default(0).notNull(),
  recordsRejected: integer("records_rejected").default(0).notNull(),
  errorSummary: jsonb("error_summary").$type<Record<string, unknown>>().default({}).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [index("legacy_import_organization_idx").on(table.organizationId, table.createdAt)]);

export const organizationProfileRelations = relations(organizationProfile, ({ one, many }) => ({ organization: one(organization, { fields: [organizationProfile.organizationId], references: [organization.id] }), offices: many(office), leadSources: many(leadSource), leads: many(lead), customers: many(customer), quotes: many(quote), jobs: many(job) }));
export const officeRelations = relations(office, ({ one, many }) => ({ organization: one(organization, { fields: [office.organizationId], references: [organization.id] }), jobs: many(job) }));
export const leadSourceRelations = relations(leadSource, ({ one, many }) => ({ organization: one(organization, { fields: [leadSource.organizationId], references: [organization.id] }), leads: many(lead) }));
export const leadRelations = relations(lead, ({ one, many }) => ({ organization: one(organization, { fields: [lead.organizationId], references: [organization.id] }), source: one(leadSource, { fields: [lead.leadSourceId], references: [leadSource.id] }), assignedUser: one(user, { fields: [lead.assignedUserId], references: [user.id] }), customers: many(customer), quotes: many(quote) }));
export const customerRelations = relations(customer, ({ one, many }) => ({ organization: one(organization, { fields: [customer.organizationId], references: [organization.id] }), lead: one(lead, { fields: [customer.leadId], references: [lead.id] }), quotes: many(quote), jobs: many(job) }));
export const quoteRelations = relations(quote, ({ one, many }) => ({ organization: one(organization, { fields: [quote.organizationId], references: [organization.id] }), customer: one(customer, { fields: [quote.customerId], references: [customer.id] }), lead: one(lead, { fields: [quote.leadId], references: [lead.id] }), jobs: many(job) }));
export const leadIntakeTokenRelations = relations(leadIntakeToken, ({ one }) => ({ organization: one(organization, { fields: [leadIntakeToken.organizationId], references: [organization.id] }), createdBy: one(user, { fields: [leadIntakeToken.createdByUserId], references: [user.id] }) }));
export const crewRelations = relations(crew, ({ one, many }) => ({ organization: one(organization, { fields: [crew.organizationId], references: [organization.id] }), assignments: many(jobCrewAssignment) }));
export const employeeRelations = relations(employee, ({ one, many }) => ({ organization: one(organization, { fields: [employee.organizationId], references: [organization.id] }), assignments: many(jobEmployeeAssignment) }));
export const employeeCompensationRelations = relations(employeeCompensation, ({ one }) => ({ organization: one(organization, { fields: [employeeCompensation.organizationId], references: [organization.id] }), employee: one(employee, { fields: [employeeCompensation.employeeId], references: [employee.id] }) }));
export const employeeTimeLogRelations = relations(employeeTimeLog, ({ one }) => ({ organization: one(organization, { fields: [employeeTimeLog.organizationId], references: [organization.id] }), employee: one(employee, { fields: [employeeTimeLog.employeeId], references: [employee.id] }), job: one(job, { fields: [employeeTimeLog.jobId], references: [job.id] }) }));
export const truckRelations = relations(truck, ({ one, many }) => ({ organization: one(organization, { fields: [truck.organizationId], references: [organization.id] }), assignments: many(jobTruckAssignment) }));
export const jobCrewAssignmentRelations = relations(jobCrewAssignment, ({ one }) => ({ organization: one(organization, { fields: [jobCrewAssignment.organizationId], references: [organization.id] }), job: one(job, { fields: [jobCrewAssignment.jobId], references: [job.id] }), crew: one(crew, { fields: [jobCrewAssignment.crewId], references: [crew.id] }) }));
export const jobEmployeeAssignmentRelations = relations(jobEmployeeAssignment, ({ one }) => ({ organization: one(organization, { fields: [jobEmployeeAssignment.organizationId], references: [organization.id] }), job: one(job, { fields: [jobEmployeeAssignment.jobId], references: [job.id] }), employee: one(employee, { fields: [jobEmployeeAssignment.employeeId], references: [employee.id] }) }));
export const jobTruckAssignmentRelations = relations(jobTruckAssignment, ({ one }) => ({ organization: one(organization, { fields: [jobTruckAssignment.organizationId], references: [organization.id] }), job: one(job, { fields: [jobTruckAssignment.jobId], references: [job.id] }), truck: one(truck, { fields: [jobTruckAssignment.truckId], references: [truck.id] }) }));
export const jobStopRelations = relations(jobStop, ({ one }) => ({ organization: one(organization, { fields: [jobStop.organizationId], references: [organization.id] }), job: one(job, { fields: [jobStop.jobId], references: [job.id] }) }));
export const jobNoteRelations = relations(jobNote, ({ one }) => ({ organization: one(organization, { fields: [jobNote.organizationId], references: [organization.id] }), job: one(job, { fields: [jobNote.jobId], references: [job.id] }), author: one(user, { fields: [jobNote.authorUserId], references: [user.id] }) }));
export const jobDamageRelations = relations(jobDamage, ({ one }) => ({ organization: one(organization, { fields: [jobDamage.organizationId], references: [organization.id] }), job: one(job, { fields: [jobDamage.jobId], references: [job.id] }) }));
export const jobChargeRelations = relations(jobCharge, ({ one }) => ({ organization: one(organization, { fields: [jobCharge.organizationId], references: [organization.id] }), job: one(job, { fields: [jobCharge.jobId], references: [job.id] }) }));
export const jobInvoiceRelations = relations(jobInvoice, ({ one }) => ({ organization: one(organization, { fields: [jobInvoice.organizationId], references: [organization.id] }), job: one(job, { fields: [jobInvoice.jobId], references: [job.id] }) }));
export const jobContractRelations = relations(jobContract, ({ one }) => ({ organization: one(organization, { fields: [jobContract.organizationId], references: [organization.id] }), job: one(job, { fields: [jobContract.jobId], references: [job.id] }) }));
export const jobPaymentRelations = relations(jobPayment, ({ one }) => ({ organization: one(organization, { fields: [jobPayment.organizationId], references: [organization.id] }), job: one(job, { fields: [jobPayment.jobId], references: [job.id] }) }));
export const storageRecordRelations = relations(storageRecord, ({ one, many }) => ({ organization: one(organization, { fields: [storageRecord.organizationId], references: [organization.id] }), job: one(job, { fields: [storageRecord.jobId], references: [job.id] }), customer: one(customer, { fields: [storageRecord.customerId], references: [customer.id] }), items: many(storageItem) }));
export const storageItemRelations = relations(storageItem, ({ one }) => ({ organization: one(organization, { fields: [storageItem.organizationId], references: [organization.id] }), storageRecord: one(storageRecord, { fields: [storageItem.storageRecordId], references: [storageRecord.id] }) }));
export const jobRelations = relations(job, ({ one }) => ({ organization: one(organization, { fields: [job.organizationId], references: [organization.id] }), office: one(office, { fields: [job.officeId], references: [office.id] }), customer: one(customer, { fields: [job.customerId], references: [customer.id] }), quote: one(quote, { fields: [job.quoteId], references: [quote.id] }) }));
