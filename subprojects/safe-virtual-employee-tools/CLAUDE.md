# SAFE Virtual Employee Tools - Project Instructions

## Context

This is a subproject inside SAFE.
Goal: build SAFE productivity tools for solo lawyers in a tool-first way, then connect them later to a virtual employee layer.

SAFE is a multi-tenant legal SaaS for law firm operations, billing, trust accounting, documents, compliance, and client delivery.

## Product Rule

Every feature must work without AI first.
AI comes later as an orchestration and personalization layer.

## Build Philosophy

- Build one tool at a time.
- Build from highest business value to lowest.
- No large rewrites.
- One daily batch only.
- Each batch must be small enough to review and test the same day.
- Prefer deterministic services, route handlers, server actions, and typed domain logic over agentic behavior.

## Tool Order

### SAFE v1 - Sellable Core

1. SAFE Time Recovery
2. SAFE Billing
3. SAFE Deadlines
4. SAFE Matters
5. SAFE Intake
6. SAFE Docs
7. SAFE Portal
8. SAFE Analytics

### SAFE v2 - Product Enrichment

9. SAFE Tasks
10. SAFE Playbooks
11. SAFE Files
12. SAFE Sign
13. SAFE Payments
14. SAFE Updates
15. SAFE Booking
16. SAFE CRM

### SAFE v3 - Premium Differentiation

17. SAFE Trust
18. SAFE Knowledge
19. SAFE Research
20. SAFE Review
21. SAFE Redaction
22. SAFE Leads
23. SAFE Communication Hub
24. SAFE Security / Compliance

## Mandatory Workflow

For every tool:

1. Explore existing code and dependencies.
2. Write or update the spec in `specs/`.
3. Write or update the task plan in `daily/` or `backlog/`.
4. Implement only the next smallest useful slice.
5. Validate.
6. Summarize what changed and propose the next batch.

## SAFE Constraints

- Multi-tenant safety is mandatory.
- Never write code that bypasses cabinet or tenant filtering.
- Do not expose data across cabinets.
- Respect role and permission patterns already present in the SAFE app.
- Human approval is required before destructive actions, external actions, billing actions, or client-facing communication.
- Keep changes narrowly scoped.
- Do not implement future tools while working on the current one.
- Do not invent legal or Barreau du Quebec compliance rules without checking the SAFE source of truth.

## Definition of Done for a Daily Batch

A daily batch is done only if:

- code is coherent,
- impacted files are limited,
- basic tests pass or manual validation is documented,
- tenant safety has been considered,
- the next step is clearly identified.

## File Conventions

- Specs go in `specs/`
- Daily plans go in `daily/`
- Backlog goes in `backlog/`
- Reusable prompts go in `prompts/`

## Output Format After Each Task

Always end with:

1. What was completed
2. Files changed
3. What remains
4. Exact next prompt for the next batch
