# 2026-05-07 - SAFE Time Recovery

## Current Tool

SAFE Time Recovery

## Objective of the Day

Prepare the first implementation batch by mapping existing SAFE models and code paths that can produce recoverable work candidates.

## Why This Batch Matters

SAFE Time Recovery should not begin with a new UI or AI layer.
It needs a reliable understanding of existing SAFE data first, especially tenant-scoped activity, billing, matter, and document models.

## Files Likely Affected

Planning/spec files:

- `subprojects/safe-virtual-employee-tools/specs/time-recovery-engine.md`
- `subprojects/safe-virtual-employee-tools/daily/2026-05-07-time-recovery-engine.md`

Code files to inspect before proposing implementation:

- `prisma/schema.prisma`
- billing services and route handlers under `lib/`, `app/`, and related modules
- matter, document, task, note, time, invoice, and audit-related files

## Step-by-Step Task List

1. Read the root `CLAUDE.md` and this subproject's `CLAUDE.md`.
2. Inspect Prisma models for time entries, invoices, invoice lines, matters/dossiers, clients, documents, notes, tasks, and audit/activity records.
3. Identify which models have reliable `cabinetId`, `clientId`, `dossierId`, timestamps, and user ownership.
4. Inspect existing billing/time services to find the safest conversion target for approved recovery candidates.
5. Update `specs/time-recovery-engine.md` with a concrete data-source map.
6. Recommend the smallest implementation slice for candidate generation.
7. Do not build UI yet unless the data model and service boundary are already obvious.

## Acceptance Criteria

- The spec lists the real SAFE models that can feed Time Recovery candidates.
- The spec identifies the safest V1 conversion target.
- Tenant-safety requirements are explicit.
- The next implementation batch is small and executable.
- No unrelated code is changed.

## Risks and Blockers

- The current billing/time model may already have conventions that must be reused.
- Some activity signals may not have complete matter or client linkage.
- Storing candidates may require a migration, which should only happen after the model map is clear.

## Exact Claude Code Prompt

```md
You are implementing the first planning batch for the SAFE subproject:
`subprojects/safe-virtual-employee-tools`.

Read:

- root `CLAUDE.md`
- `subprojects/safe-virtual-employee-tools/CLAUDE.md`
- `subprojects/safe-virtual-employee-tools/specs/time-recovery-engine.md`
- `subprojects/safe-virtual-employee-tools/daily/2026-05-07-time-recovery-engine.md`

Your task today is not to build UI or AI.
Your task is to inspect the current SAFE codebase and update the SAFE Time Recovery spec with a concrete map of existing data sources.

Do the following:

1. Inspect Prisma models and existing services/routes for billing, time, invoices, matters/dossiers, clients, documents, notes, tasks, and audit/activity records.
2. Identify which existing models can safely produce recoverable work candidates.
3. For each candidate source, document available tenant fields, client/matter linkage, timestamps, and likely recovery signal.
4. Identify the safest V1 conversion target for approved candidates.
5. Update `subprojects/safe-virtual-employee-tools/specs/time-recovery-engine.md`.
6. Update this daily file with what you learned and the exact next implementation prompt.

Constraints:

- Preserve multi-tenant safety.
- Do not implement new database models yet unless the existing architecture makes the need unavoidable.
- Do not implement AI behavior.
- Do not change unrelated files.

End with:

1. What was completed
2. Files changed
3. What remains
4. Exact next prompt for the next batch
```
