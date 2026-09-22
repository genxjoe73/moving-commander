# Legacy workflow inventory

This is a living behavioral map of the delivered ASP.NET MVC source. It records what the replacement must preserve without copying unsafe implementation choices.

## Lead intake

Primary source: `Starting Code/Demo/Controllers/QuoteController.cs`, `GetLeads` and its asynchronous variant.

Legacy behavior:

1. Load every active `LeadTemplate` and its `LeadTemplateDetail` mappings.
2. Connect to one configured POP3 host over TLS on port 995, authenticating with credentials stored per template.
3. Select messages whose exact sender address matches `LeadTemplate.SourceEMail`.
4. Deduplicate using the email `Message-Id`, stored in the quote notes field.
5. Parse the plain-text or HTML body line by line as `label: value` pairs.
6. Translate external labels into quote fields through `LeadTemplateDetail.ItemText -> JobField`.
7. Apply company defaults for office, referral type, job/BOL/crew/activity types, salesperson, tax, liability, movers, trucks, state, and monetary values.
8. Put unmapped content into notes, save the quote, optionally send a response, and delete processed mail.

Replacement decisions:

- Intake creates a normalized `lead` first instead of an oversized quote record.
- `source_message_id` has a tenant-scoped unique constraint for idempotency.
- Manual entry and lead conversion are implemented first; automated ingestion will use provider webhooks or secure email forwarding, with polling as a compatibility adapter.
- Automated intake is now available at `/api/intake/leads` using tenant-specific hashed bearer tokens. It accepts normalized JSON fields or the legacy `label: value` body format and deduplicates on `source_message_id`.
- Mail credentials will live in an encrypted secret provider, never in application tables or source control.
- Source mappings remain tenant-configurable through `lead_source.field_mapping`.
- Conversion creates a linked customer and draft quote in one transaction and records an audit event.

## Customer and quote conversion

The legacy quote flow searches for customers using overlapping email/name/phone combinations and can create a customer from quote contact fields. The replacement makes that relationship explicit:

- Lead to customer is traceable through `customer.lead_id`.
- Lead/customer/quote creation is tenant-scoped and transactional.
- A lead can be converted once to a customer; later quote creation should reuse that customer.
- Exact duplicate-detection rules must be validated against production data before automated merging is enabled.

## Quote and job conversion

The new quote editor carries forward the legacy contact, move, labor, trip, flat-rate, tax, liability, and notes concepts while storing a calculation snapshot. It applies Item 22 quarter-hour rounding, the captured Texas local maximum rates, Section 3 distance/weight tables, Item 225 warehouse rates, overtime multiplication, and the 30% surcharge cap. The quote can be handed off into a scheduled job with crew, truck, address, and operational status fields.

## Tenant model

The legacy application appears to assume one company per deployment/database (`SetUps.FirstOrDefault()` and a fixed connection string). `BusinessOffice` represents branches, not tenants. The replacement therefore introduces explicit organizations, memberships, tenant-owned records, and offices beneath each organization.

## Deferred high-risk areas

Jobs, dispatch, contracts, payments, storage, payroll, general ledger, and accounting require separate workflow maps and reconciliation fixtures. Payroll/accounting will not be treated as complete until totals can be compared against a representative legacy SQL backup.
