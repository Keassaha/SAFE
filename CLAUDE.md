# CLAUDE.md — SAFE Inc. Codebase

> Instructions automatically loaded by Claude Code at each session.

---

## Project Overview

**SAFE Inc.** — SaaS platform for legal practice management (French: "Système Automatisé de Facturation et d'Exploitation").

Target: Small law firms in Quebec (1-5 lawyers) managing cases, billing, payments, and compliance.

### Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Server Actions, Next.js Middleware
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js (Credentials + JWT), role-based access control
- **Email**: Resend
- **AI**: Claude API (Anthropic SDK) for document suggestions
- **Payment**: Stripe (SaaS subscriptions)
- **Editors**: Tiptap (rich text documents), React Query (data fetching)
- **PDFs**: React-PDF Renderer, PDFKit
- **Internationalization**: next-intl (French/English)

---

## External Context (Critical References)

Two external folders are permanent references for this project. **Always consult before coding or specifying features.**

### 1. Delivery System Pipeline

```
~/Desktop/Delivery Syst/
```

3-phase onboarding system (Understand → Specify → Build) for law firm integration.

- `CLAUDE.md` — **read first** for pipeline rules
- `prompts/` — executable Phase 1, 2, post-delivery prompts
- `templates/` — mandatory YAML data contracts
- `knowledge-base/` — SAFE modules, Quebec regulatory compliance, client patterns
- `clients/` — per-client deployment folders

**Before coding any feature**: Consult the KB at `~/Desktop/Delivery Syst/knowledge-base/`.

### 2. SAFE Inc. Corporate Folder

```
~/Desktop/SAFE Inc./
```

Operational, legal, financial, and marketing documents.

- `01 - Infrastructure` — technical architecture
- `02 - Clients` — per-client folders
- `03 - Contrats` — signed contracts
- `04 - Financier` — financial records
- `05 - Marketing` — marketing materials
- `06 - Futurpreneur` — funding folder
- `07 - Operations` — internal processes
- `08 - Templates Emails` — email templates
- `09 - Droit` — Quebec Bar Association compliance, legal obligations
- `10 - Delivery Pipeline` — copy of pipeline (see #1)
- `11 - Subventions` — subsidies/grants
- `CEO` — executive documents

**For legal/compliance features**: Always check `~/Desktop/SAFE Inc./09 - Droit/` for Quebec Bar requirements.

---

## Project Structure

```
/home/user/SAFE/
├── app/                    # Next.js App Router routes
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Root layout
│   ├── (auth)/            # Auth routes (login, signup, password reset)
│   ├── (app)/             # Protected app routes (requires auth)
│   │   ├── tableau-de-bord/    # Dashboard
│   │   ├── clients/            # Client management
│   │   ├── dossiers/           # Case management (core module)
│   │   ├── facturation/        # Billing, invoices
│   │   ├── temps/              # Time tracking
│   │   ├── comptabilite/       # Accounting, reconciliation
│   │   ├── edition/            # Document editing/redaction
│   │   ├── parametres/         # Settings, configuration
│   │   ├── outils/             # Tools, utilities
│   │   ├── conformite/         # Compliance (audit logs, document retention)
│   │   ├── journal/            # General ledger (accounting journal)
│   │   ├── employees/          # Employee/payroll management
│   │   ├── import/             # Data import tools
│   │   ├── gestion/            # Project/task management
│   │   ├── fiches-de-temps/    # Time entry forms
│   │   ├── rapports/           # Reports (revenue by client, lawyer)
│   │   ├── comptes/            # Trust accounts (client money)
│   │   └── api/                # Internal API endpoints
│   ├── api/                     # Public API routes (webhooks, external integrations)
│   │   ├── contact/            # Contact form submission
│   │   ├── audit-gratuit/      # Free audit form
│   │   ├── onboarding/         # Onboarding data
│   │   ├── temps/              # Time tracking API
│   │   ├── audit-log/          # Audit logging
│   │   └── ...
│   ├── audit-gratuit/          # Free audit landing page
│   ├── tarification/            # Pricing page
│   ├── a-propos/                # About page
│   └── contact/                 # Contact page
│
├── components/             # Reusable React components (organized by feature)
│   ├── audit/              # Audit components
│   ├── auth/               # Login, signup forms
│   ├── clients/            # Client list, forms
│   ├── dossiers/           # Case management UI
│   ├── dashboard/          # Dashboard widgets
│   ├── facturation/        # Invoice UI
│   ├── edition/            # Document editing (Tiptap integration)
│   ├── landing/            # Landing page components
│   ├── layout/             # Layout, navigation
│   ├── onboarding/         # Onboarding flows
│   ├── outils/             # Tool-specific components
│   └── ...
│
├── lib/                    # Core business logic & utilities
│   ├── actions/            # Server actions (Next.js form submissions)
│   ├── ai/                 # AI integration (Claude API)
│   ├── audit-gratuit/      # Free audit logic
│   ├── auth.ts             # Auth utilities, JWT handling
│   ├── db.ts               # Prisma client instance
│   ├── db-vercel-check.ts  # Vercel DB health check
│   ├── clients/            # Client business logic
│   ├── dossiers/           # Case (dossier) business logic
│   ├── dashboard/          # Dashboard data aggregation
│   ├── design-tokens.ts    # Design system colors, spacing
│   ├── email-templates/    # Email template strings
│   ├── email.ts            # Email sending (Resend)
│   ├── edition/            # Document editing logic
│   ├── facturation/        # Billing calculations, invoice generation
│   ├── format.ts           # Number/date formatting
│   ├── formatDate.ts       # Localized date formatting
│   ├── gestion/            # Task/project management logic
│   ├── hooks/              # Custom React hooks
│   ├── i18n/               # Internationalization setup
│   ├── import/             # Data import logic
│   ├── invoice-calculations.ts # Complex invoice math
│   ├── motion.ts           # Framer Motion animation configs
│   ├── onboarding/         # Onboarding flow logic
│   ├── rapports/           # Report generation
│   ├── routes.ts           # Centralized route definitions
│   ├── services/           # External API integrations (Stripe, Resend)
│   ├── stripe.ts           # Stripe utilities
│   ├── stripe-client.ts    # Stripe client-side code
│   ├── temps/              # Time entry calculations
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # General utilities (date, string, math)
│   ├── utils.ts            # Misc utilities
│   └── validations/        # Zod schemas for validation
│
├── prisma/                 # Database schema & migrations
│   ├── schema.prisma       # Prisma data model
│   └── migrations/         # Database migration history
│
├── public/                 # Static assets (images, fonts)
│
├── i18n/                   # Internationalization (FR/EN) message catalogs
│
├── supabase/               # Supabase configuration (if used)
│
├── scripts/                # Utility scripts (seeding, migrations)
│
├── types/                  # Top-level type definitions (sometimes)
│
├── docs/                   # Project documentation
│
├── planning/               # Project planning & specs
│
├── .env.example            # Environment variables template
├── next.config.ts          # Next.js configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── middleware.ts           # Next.js middleware (auth routing)
├── package.json            # Dependencies & scripts
├── README.md               # Project README
├── DEPLOYMENT.md           # Deployment to Vercel
├── IMPLEMENTATION_SUMMARY.md # Current phase roadmap
└── CLAUDE.md              # This file
```

---

## Database & Prisma

### Key Models

**Cabinet** (Law Firm)
- Multi-tenant root: every other model has `cabinetId`
- Stripe subscription info (plan, customerId, currentPeriodEnd)
- Configuration (interest rates, billing format, etc.)

**User** (Team Member)
- Roles: `admin_cabinet`, `avocat` (lawyer), `assistante` (assistant), `comptabilite` (accountant)
- All queries are scoped to `cabinetId` (isolation)
- Default hourly rate for billing

**Client** (Law Firm Client)
- Contact info, client type
- Multiple lawyers assigned (responsible lawyer, assistant, accountant)
- Linked to dossiers

**Dossier** (Legal Case)
- Core aggregate: status (active/closed), responsible lawyer, documents, time entries
- Trust account for client money
- Linked to timeEntries, invoices, tasks

**TimeEntry** (Billable Hours)
- Linked to dossier, user, cabinet
- Rate, hours, calculated amount
- Used for invoicing

**Invoice** (Billing)
- Lines from TimeEntry, manual additions
- Status: draft/finalized/paid/partially_paid
- Payment tracking

**Payment** (Received Money)
- Linked to invoice
- Reconciliation with bank imports

**Document** (File Uploads)
- Dossier documents (contracts, correspondence)
- Uploaded by user, reviewed by lawyer
- Retention policy (auto-delete after period)

### Running Migrations

```bash
# Generate Prisma client
npm run db:generate

# Create a new migration
npm run db:migrate

# Apply migrations in production (Vercel)
# Handled by vercel-build script in package.json

# View data in Prisma Studio
npm run db:studio
```

### Multi-Tenancy Pattern

**Every query must include `cabinetId`.**

```typescript
// ❌ WRONG: No cabinet scope
const users = await prisma.user.findMany();

// ✅ CORRECT: Cabinet scoped
const users = await prisma.user.findMany({
  where: { cabinetId: session.cabinetId }
});
```

---

## Authentication & Authorization

### NextAuth.js Setup

- **Provider**: Credentials (email/password)
- **Session Strategy**: JWT
- **Secret**: `NEXTAUTH_SECRET` env var

### User Roles & Permissions

| Role | Clients | Dossiers | Time | Invoices | Reports | Settings | Accounting |
|------|---------|----------|------|----------|---------|----------|------------|
| `admin_cabinet` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `avocat` | read | ✓ | ✓ | read | own | — | — |
| `assistante` | ✓ | ✓ | ✓ | draft | — | — | — |
| `comptabilite` | read | read | read | ✓ | ✓ | — | ✓ |

### Middleware (`middleware.ts`)

- Redirects unauthenticated users to `/connexion`
- Protects `/app/*` routes
- Adds `cabinetId` to request headers

### Session Object

```typescript
session.user = {
  id: string
  email: string
  nom: string
  role: UserRole
  cabinetId: string
}
```

---

## Core Modules & Features

### 1. Dashboard (`lib/dashboard/`)

- KPIs: Revenue (CA), cash collected, receivables, active cases
- Chart: monthly revenue trend
- Recent activity feed
- Role-filtered visibility

### 2. Client Management (`lib/clients/`, `components/clients/`)

- CRUD operations
- Linked dossiers display
- Lawyer assignment
- Contact info & status

### 3. Case Management / Dossiers (`lib/dossiers/`, `components/dossiers/`)

- **Core module**: Dossier (legal case) aggregates time entries, invoices, documents
- Status: Active / Closed
- Responsible lawyer, assistant, documents
- Cannot close without resolving all pending tasks (force-active-task rule)
- Dossier sections for organizing content

### 4. Time Tracking (`lib/temps/`)

- Create time entries (date, hours, rate, dossier)
- Billable flag, status (submitted/approved)
- Calculate amount = hours × rate
- Lock entries after invoice finalization

### 5. Billing & Invoicing (`lib/facturation/`)

- **Invoice** aggregates TimeEntries + manual lines
- Numbering scheme (e.g., 2026-001)
- Status workflow: draft → finalized → paid
- PDF generation using React-PDF
- Payment tracking
- Credit notes for reversals

**Key calculation**:
```
Invoice.total = sum(TimeEntry.amount) + sum(ManualLines.amount) - Discounts
```

### 6. Payments (`lib/facturation/`)

- Record payments against invoices
- Partial payment support
- Reconciliation with bank imports
- Aging report (overdue amounts)

### 7. Document Management (`lib/documents/`, `lib/edition/`)

- **Document**: File uploads (legacy)
- **RedactionDocument**: Tiptap editor (new)
  - Rich text editing
  - Variable substitution (e.g., `{{clientName}}`)
  - Spell-check, AI suggestions
  - Export to PDF/DOCX
  - Versioning & finalization

### 8. Email & Notifications (`lib/email.ts`, `lib/email-templates/`)

- Resend API for transactional emails
- Templates:
  - Invoice sent
  - Payment received
  - Account created
  - Password reset
- SMS integration (future)

### 9. AI Integration (`lib/ai/`)

- Claude API integration for document suggestions
- Grammar, tone, legal terminology
- Hallucination checking (manual review mandatory)
- Prompt templates for common tasks

### 10. Project Management & Tasks (`lib/gestion/`)

- Tasks linked to dossiers
- Status: TODO, IN_PROGRESS, DONE, BLOCKED
- Parent-child task hierarchy
- Kanban board visualization
- Automation rules (deadline reminders, inactivity alerts)
- Force-active-task rule: cannot close dossier without IN_PROGRESS task

### 11. Accounting & Reconciliation (`lib/facturation/`)

- Journal entries (general ledger)
- Trust account tracking (client money)
- Bank import reconciliation
- Daily reconciliation job (detects inconsistencies)
- Audit trail of all changes

### 12. Reports (`lib/rapports/`)

- Revenue by client (YTD, by month)
- Revenue by lawyer (YTD, by month)
- Case status summary
- Aging analysis (overdue invoices)
- Time tracking summary

### 13. Compliance & Audit (`components/conformite/`)

- Audit log: every action logged (CRUD, document access, payments)
- Retention policies: auto-delete old documents
- Consent logs: GDPR compliance
- Data export capabilities

---

## Code Conventions

### TypeScript

- **Strict mode**: `strict: true` in `tsconfig.json`
- **Type aliases**: Use in `lib/types/` (not inline)
- **Zod schemas**: Use for runtime validation at system boundaries

```typescript
// lib/validations/invoice.ts
export const CreateInvoiceSchema = z.object({
  dossierIds: z.array(z.string()),
  discountPercent: z.number().min(0).max(100).optional()
});
```

### React & Components

- **Functional components** with hooks only
- **Server Components** by default (App Router)
- **Client Components** for interactivity: mark with `"use client"`
- **Component organization**:
  - One component per file
  - Named export + default export same name
  - Props interface named `${ComponentName}Props`

```typescript
// components/clients/ClientCard.tsx
"use client"

import { Client } from "@/prisma/client"

interface ClientCardProps {
  client: Client
  onSelect?: (id: string) => void
}

export function ClientCard({ client, onSelect }: ClientCardProps) {
  // ...
}
```

### Server Actions (`lib/actions/`)

- Use for form submissions and mutations
- Always validate input with Zod
- Always check `cabinetId` from session
- Return `{ error?: string, success?: boolean, data?: T }`

```typescript
// lib/actions/clients.ts
"use server"

import { CreateClientSchema } from "@/lib/validations/client"

export async function createClient(formData: FormData) {
  const session = await getSession()
  if (!session?.user) return { error: "Unauthorized" }

  const input = {
    nom: formData.get("nom"),
    // ...
  }

  const parsed = CreateClientSchema.parse(input)
  
  const client = await prisma.client.create({
    data: { ...parsed, cabinetId: session.user.cabinetId }
  })

  return { success: true, data: client }
}
```

### Styling

- **Tailwind CSS** for all styling
- **Design tokens** in `lib/design-tokens.ts` for consistent colors
- **Framer Motion** for animations (see `lib/motion.ts` presets)
- **No inline CSS**: use Tailwind classes or CSS modules

### Testing

- **Vitest** for unit tests
- Test files: `*.test.ts` or `*.test.tsx` in same dir as code
- Run: `npm run test` (watch) or `npm run test:run` (single run)

```typescript
// lib/invoice-calculations.test.ts
import { describe, it, expect } from "vitest"
import { calculateInvoiceTotal } from "./invoice-calculations"

describe("calculateInvoiceTotal", () => {
  it("sums time entries and manual lines", () => {
    const result = calculateInvoiceTotal(
      [{ amount: 100 }, { amount: 50 }],
      [{ amount: 25 }],
      0 // discount %
    )
    expect(result).toBe(175)
  })
})
```

### Internationalization (i18n)

- Use `next-intl` for FR/EN translations
- Message files in `i18n/` (one per language)
- Use `useTranslations()` hook in components

```typescript
"use client"

import { useTranslations } from "next-intl"

export function Header() {
  const t = useTranslations("header")
  return <h1>{t("title")}</h1>
}
```

---

## Common Development Workflows

### Adding a New Feature

1. **Spec phase** (from Delivery System):
   - Check KB at `~/Desktop/Delivery Syst/knowledge-base/`
   - Validate with pipeline CLAUDE.md
   - Document in `planning/` folder

2. **Database phase**:
   - Add models to `prisma/schema.prisma`
   - Create migration: `npm run db:migrate`
   - Update `lib/types/` if needed

3. **Backend phase**:
   - Add server action in `lib/actions/`
   - Add API route in `app/(app)/api/` if needed
   - Add business logic in `lib/{feature}/`

4. **Frontend phase**:
   - Create component in `components/{feature}/`
   - Add form/page in `app/(app)/{feature}/`
   - Test manually in dev server

5. **Testing phase**:
   - Add unit tests for calculations
   - Test multi-tenant isolation
   - Verify role-based access
   - Test edge cases (null values, empty lists)

### Creating a Migration

```bash
npm run db:migrate
# Enter migration name, e.g., "add_task_deadline_field"
# Edit generated file in prisma/migrations/
npm run db:generate
```

### Testing Locally

```bash
# Start dev server
npm run dev
# Open http://localhost:3001

# View database
npm run db:studio

# Run tests
npm run test

# Lint
npm run lint
```

### Deploying to Vercel

See `DEPLOYMENT.md` for full instructions. Key steps:

1. Push to `claude/add-claude-documentation-yEbtH` branch
2. Create PR → Vercel preview builds automatically
3. Review preview
4. Merge to main → production deployment
5. Migrations run automatically (see `vercel-build` script)

---

## Working Rules

### Before Coding

- ❌ Don't build without validated spec from Delivery System
- ✓ Consult KB at `~/Desktop/Delivery Syst/knowledge-base/` for business rules
- ✓ Check `~/Desktop/SAFE Inc./09 - Droit/` for compliance requirements
- ✓ Respect YAML data contract templates for client documents

### Code Quality

- ❌ Don't commit without passing linter: `npm run lint`
- ✓ Use TypeScript strict mode (no `any` without justification)
- ✓ Always scope queries to `cabinetId` for multi-tenant isolation
- ✓ Validate input at system boundaries (user forms, external APIs)
- ✓ Test calculations with unit tests (invoice, time tracking)

### Logging & Monitoring

- ✓ Use `createAuditLog()` for all meaningful user actions
- ✓ Log errors to console in dev, monitoring service in production
- ✓ Include `cabinetId` in all error logs for debugging

### Security

- ✓ Never log sensitive data (passwords, credit cards, client names)
- ✓ Use environment variables for secrets (API keys, DB URLs)
- ✓ Validate `cabinetId` from session, never trust client input
- ✓ Use HTTPS only in production
- ✓ Keep dependencies updated: `npm audit`

---

## Performance Tips

- **Database**: Add indexes to frequently queried fields (e.g., `dossierIds` in TimeEntry)
- **API**: Use `select` to fetch only needed fields from Prisma
- **Images**: Optimize with Next.js Image component
- **Bundles**: Monitor with `npm run build` output
- **Caching**: Cache static pages with `revalidatePath` when data changes

---

## Current Development Status

See `IMPLEMENTATION_SUMMARY.md` for the current roadmap and phase breakdown.

### Key Architectural Decisions

1. **Dossier-Centric**: All features scoped to case, except Calendar (firm-wide)
2. **RedactionDocument ≠ Document**: Separate models for editing vs. uploads
3. **Task (formerly DossierTache)**: Extended with automation & parent-child chaining
4. **Force-Active-Task Rule**: Cannot close dossier without `IN_PROGRESS` task
5. **BullMQ + Redis**: Single queue for automation, email, SMS, notifications
6. **AI Integration**: Claude API for document suggestions (manual review mandatory)
7. **Multi-Tenant Strict**: Every query includes `cabinetId`

---

## Useful Commands

```bash
# Development
npm run dev                    # Start dev server (port 3001)
npm run dev:free              # Kill existing process on port 3001
npm run build                 # Build production bundle
npm run start                 # Start production server

# Database
npm run db:generate           # Regenerate Prisma client
npm run db:migrate            # Create & run migration
npm run db:baseline           # Mark initial migration as applied
npm run db:studio             # Open Prisma Studio GUI

# Testing & Linting
npm run test                  # Vitest watch mode
npm run test:run              # Vitest single run
npm run lint                  # ESLint

# Debugging
npm run db:studio             # Inspect data
echo "SELECT * FROM ..." | PGPASSWORD=... psql -h host -U user -d dbname
```

---

## Key Files to Know

- `middleware.ts` — Auth routing, session attachment
- `lib/auth.ts` — Session utils, JWT handling
- `lib/db.ts` — Prisma singleton instance
- `lib/routes.ts` — Centralized app routes
- `lib/design-tokens.ts` — Colors, spacing (Tailwind config source)
- `lib/invoice-calculations.ts` — Complex billing math
- `components/layout/` — Main navigation, protected wrapper
- `prisma/schema.prisma` — Data model (source of truth)

---

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED
```

1. Check `DATABASE_URL` in `.env` is valid
2. Check PostgreSQL is running: `psql` command
3. For Supabase: ensure project is not paused
4. Try direct connection: `psql $DIRECT_URL`

### Migration Failed

```
Error: P3005 ... (migration: 20260101000000_init)
```

1. Check if migration already applied: `npm run db:studio`
2. Manual recovery: `prisma migrate resolve --rolled-back <migration>`
3. Ask team before force-resetting (data loss risk)

### Auth Not Working

1. Check `NEXTAUTH_SECRET` is set and valid
2. Check `NEXTAUTH_URL` matches deployment URL
3. Check cookies enabled in browser
4. Clear browser cookies, restart dev server

### Vercel Deployment Failed

1. Check `vercel.json` and `vercelignore`
2. Check migrations run: `npm run vercel-build` locally
3. Check env vars on Vercel dashboard
4. Check build logs for TypeScript errors

---

## Last Updated

**2026-04-27** by Claude Code

Branch: `claude/add-claude-documentation-yEbtH`

**Next Steps**: Review this documentation, iterate based on feedback, commit, and push.
