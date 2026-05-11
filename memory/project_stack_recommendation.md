---
name: Moving Commander Stack Recommendation
description: Agreed stack for rebuilding Moving Commander as a modern web app
type: project
---

Next.js + TypeScript + Tailwind CSS + Railway deployment.

**Why:** Scales from Quick Quote page to full internal app without changing stack. Railway gives a live URL after every push and supports a managed Postgres add-on when we move past v1's no-backend phase. Repo: github.com/genxjoe73/moving-commander (currently public, going private after initial setup).

**Build order agreed:**
1. Quick Quote page (public, standalone, no auth/DB) — first chunk, still needs friend's rate answers
2. Auth + company setup
3. Customer management
4. Quotes (internal)
5. Jobs
6. Invoicing/payments
7. Storage
8. Crew/scheduling
9. Payroll/commissions (hardest, last)
10. Accounting/GL + Reporting

**Working model:** Joe is dev, Claude does heavy lifting on code, friend answers business logic questions. Session-based work — documentation and decision log are critical for continuity.

**Status:** Not started. Waiting on friend's rate/pricing answers before building Quick Quote page.

**Why:** Stack chosen to scale from Quick Quote through full rewrite without changing technology.
**How to apply:** Start every new session on this project by checking this recommendation and the open rate questions before writing any code.
