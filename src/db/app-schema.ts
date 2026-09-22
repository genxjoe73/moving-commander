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
export const jobRelations = relations(job, ({ one }) => ({ organization: one(organization, { fields: [job.organizationId], references: [organization.id] }), office: one(office, { fields: [job.officeId], references: [office.id] }), customer: one(customer, { fields: [job.customerId], references: [customer.id] }), quote: one(quote, { fields: [job.quoteId], references: [quote.id] }) }));
