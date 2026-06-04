# SAFE Virtual Employee Tools - Master Backlog

## Priority Rule

SAFE v1 is the sellable core.
SAFE v2 enriches the product after the core is coherent.
SAFE v3 is premium differentiation.

Do not start SAFE v2 until SAFE v1 has a usable operational path.
Do not start SAFE v3 until SAFE v1 and the relevant v2 foundations are stable.

## SAFE v1 - Sellable Core

### 1. SAFE Time Recovery

Goal: capture billable time from real work already happening in SAFE.

Initial non-AI slices:

- inventory activity signals that imply legal work,
- define recoverable time candidates,
- create deterministic scoring rules,
- add a review queue,
- allow approval, dismissal, deferral, and conversion to billable entries.

AI later:

- summarize why an activity is likely billable,
- suggest time-entry wording,
- personalize recovery patterns by lawyer and matter type.

### 2. SAFE Billing

Goal: handle invoices, payments, follow-ups, and unbilled work.

Initial non-AI slices:

- detect matters ready for billing,
- group unbilled time, fees, and expenses,
- surface invoice blockers,
- prepare draft invoices for review,
- track payment and reminder status.

AI later:

- suggest invoice narratives,
- flag unusual write-downs,
- explain billing readiness.

### 3. SAFE Deadlines

Goal: manage legal calendars, reminders, and extracted dates.

Initial non-AI slices:

- deadline model,
- manual deadline entry,
- matter-linked calendar/list views,
- reminders,
- status and ownership.

AI later:

- extract proposed deadlines from documents or notes,
- draft reminder explanations,
- suggest next procedural steps with human validation.

### 4. SAFE Matters

Goal: manage matters, clients, statuses, history, and operational context.

Initial non-AI slices:

- matter profile,
- client linkage,
- status history,
- important dates,
- recent activity,
- billing and document summaries.

AI later:

- summarize matter status,
- identify stale matters,
- recommend next operational actions.

### 5. SAFE Intake

Goal: support intake, qualification, forms, and conflict checks.

Initial non-AI slices:

- intake forms,
- lead qualification,
- conflict checklist,
- matter creation,
- retainer task list.

AI later:

- summarize intake,
- suggest matter category,
- draft first client response.

### 6. SAFE Docs

Goal: automate documents, templates, and questionnaires.

Initial non-AI slices:

- template inventory,
- matter/client field mapping,
- deterministic merge,
- preview and export,
- version tracking.

AI later:

- suggest clause variants,
- detect missing facts,
- summarize generated document assumptions.

### 7. SAFE Portal

Goal: provide client document sharing and safe status updates.

Initial non-AI slices:

- portal visibility controls,
- document sharing,
- status fields,
- update templates,
- review-before-send workflow.

AI later:

- draft plain-language updates,
- summarize recent activity,
- adapt tone per client.

### 8. SAFE Analytics

Goal: show KPIs, performance, revenue, pipeline, and workload.

Initial non-AI slices:

- KPI definitions,
- dashboard queries,
- revenue and pipeline views,
- workload trends,
- exportable reports.

AI later:

- explain anomalies,
- suggest operational improvements,
- generate weekly briefings.

## SAFE v2 - Product Enrichment

9. SAFE Tasks - tasks, follow-ups, and internal actions.
10. SAFE Playbooks - standardized workflows by matter type.
11. SAFE Files - document management and internal search.
12. SAFE Sign - e-signatures and retainer tracking.
13. SAFE Payments - payment collection and invoice-linked reminders.
14. SAFE Updates - automated client communication workflows.
15. SAFE Booking - appointments, self-scheduling, and calendars.
16. SAFE CRM - advanced prospect pipeline and follow-ups.

## SAFE v3 - Premium Differentiation

17. SAFE Trust - trust accounting and fiduciary workflows.
18. SAFE Knowledge - internal knowledge base, precedents, and clauses.
19. SAFE Research - augmented legal research.
20. SAFE Review - contract review, verification, and AI assistance.
21. SAFE Redaction - redaction and sensitive document processing.
22. SAFE Leads - lead acquisition and distribution.
23. SAFE Communication Hub - centralized client/cabinet messaging.
24. SAFE Security / Compliance - permissions, audit, security, and compliance layer.

## Current Focus

Current tool: SAFE Time Recovery

Build day 1: map the existing SAFE models and services that can feed recoverable time candidates before adding storage, UI, or AI.
