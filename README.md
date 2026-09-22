# Moving Commander

Modern multi-tenant replacement for the legacy Moving Commander ASP.NET MVC application. The repository preserves the delivered legacy source under `Starting Code/` as a behavioral and data-migration reference.

## Current product surface

- Public marketing site rebuilt from the live Moving Commander brand
- Email/password authentication and secure sessions
- Company onboarding, memberships, roles, offices, and platform administration
- Tenant-scoped PostgreSQL records with audit logs and legacy import identifiers
- Lead intake, pipeline stages, and conversion to customer plus draft quote
- Automated lead intake endpoint with tenant-specific bearer tokens
- Customer and quote registers with a full quote editor
- Tariff-aware local hourly, long-haul, warehouse, and flat-rate calculations
- Scheduled jobs with crew, truck, address, and status controls
- Dispatch crew assignments, contract tracking, payment records, storage records, and inventory items
- Railway build, migration, health-check, and deployment configuration

Jobs currently has a connected module shell. Scheduling, contracts, payments, storage, payroll, and accounting are staged for later conversion.

## Local development

Requires Node.js 20.9+ and PostgreSQL.

```bash
npm install
cp .env.example .env.local
npm run db:migrate
npm run dev
```

Required environment variables:

```dotenv
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=at-least-32-random-characters
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
PLATFORM_ADMIN_EMAILS=owner@example.com
```

`PLATFORM_ADMIN_EMAILS` is a comma-separated allowlist for the cross-tenant platform console. Tenant authorization still comes from organization membership.

## Commands

```bash
npm run lint
npm test
npm run build
npm run db:generate
npm run db:migrate
```

Production deploys run `npm run db:migrate` before starting the Next.js server. Never place customer data or production credentials in the repository.

## Automated lead intake

Company owners and admins can create a one-time bearer token in Company Setup. Send a JSON `POST` to `/api/intake/leads`:

```bash
curl -X POST https://moving-commander-production.up.railway.app/api/intake/leads \
  -H 'Authorization: Bearer mc_live_...' \
  -H 'Content-Type: application/json' \
  -d '{"sourceMessageId":"provider-123","fields":{"firstName":"Taylor","lastName":"Mover","email":"taylor@example.com","phone":"555-0100","moveDate":"2026-10-15","originPostalCode":"76010","destinationPostalCode":"76102"}}'
```

The endpoint is idempotent by tenant and `sourceMessageId`. It accepts normalized fields or the legacy `label: value` email-body format through `rawText`, then places the record in the same lead pipeline as manual intake.

## Conversion sequence

1. Reconstruct legacy SQL entities and preserve traceable legacy IDs.
2. Document workflows and business rules from the MVC controllers, models, views, and migrations.
3. Establish the PostgreSQL tenant model, authentication, permissions, and audit trail.
4. Port lead intake, customers, and quotes.
5. Port jobs, dispatch, scheduling, contracts, payments, and storage.
6. Port payroll and accounting with dedicated reconciliation tests.
7. Import production SQL only after source-to-target reconciliation passes.

See [`Docs/legacy-workflows.md`](Docs/legacy-workflows.md) for the current behavioral inventory.
