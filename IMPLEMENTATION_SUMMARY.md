# SAFE Inc. 6-8 Week Integration Roadmap

**Status**: Ready to begin Phase 1  
**Unified Schema**: `/prisma/schema.prisma.unified`  
**Detailed Plan**: `planning/implementation-plan-unified-modules.md`

---

## What's Happening

You identified accounting coherence issues in SAFE (multiple sources of truth, no sync, inconsistent data). Before fixing those, you've decided to integrate two critical modules that will provide the foundation:

1. **Documents & Rédaction** (Tiptap editor, templates, email/SMS)
2. **Gestion de Projet & Calendrier** (tasks, automation, notifications)

Then: **Accounting Coherence Fixes** (sync hub, reconciliation, audit trail)

This sequence makes sense because the project/task workflow will feed cleaner data into the accounting system.

---

## 4-Phase Breakdown

### Phase 1: Database Migration (Week 1-2)
**3 tasks**, foundation layer.
- Create Prisma migration (new models: RedactionDocument, Task, Template, Email, SMS, etc.)
- Seed 20+ system templates (legal correspondence, retainer, procedure templates)
- Deploy to staging + validate

**Success**: Migration runs, zero data loss, templates visible.

### Phase 2: Documents & Rédaction (Week 2-4)
**14 tasks**, users can create/edit legal documents.
- Tiptap editor component + variable substitution
- RedactionDocument CRUD routes
- PDF/DOCX export
- Email/SMS composition + queue
- AI suggestions (Claude integration)
- Document versioning + finalization
- Search/filter + retention policy

**Success**: Users create a letter template, edit it, export to PDF, email it with one click.

### Phase 3: Project Management & Calendar (Week 4-6)
**16 tasks**, users can manage tasks + calendar.
- Task CRUD + Kanban board (drag-drop status change)
- Calendar (firm-wide, shows all events + task deadlines)
- **Force-active-task rule** (prevents dossier closure without active task — MANDATORY)
- Automation rules (inactivity alerts, deadline reminders, auto-task creation)
- BullMQ + Redis for background jobs
- Multi-channel notifications (in-app, email, SMS, push)
- External calendar sync (Google, Outlook)

**Success**: Users see all tasks in a Kanban, drag to mark complete, get notified, can't close a dossier without an active task.

### Phase 4: Accounting Coherence (Week 6+)
**12 tasks**, accounting data is reliable.
- Invoice recalculation engine (atomic, cascades to payments)
- Trust account synchronization (always matches transaction sum)
- Debours (expense) synchronization
- Payment reconciliation (auto-match bank imports)
- Daily reconciliation job (detects inconsistencies automatically)
- Manual override UI + audit logging
- Dashboard consistency checks

**Success**: Invoice amount = sum of time entries. Trust balance = sum of transactions. All changes logged.

---

## Key Architectural Decisions (Already Made)

### 1. **Dossier-Centric**
All features scoped to a specific case, EXCEPT Calendar (firm-wide, only exception).  
**Why**: Prevents cross-dossier leakage, isolates context.

### 2. **RedactionDocument ≠ Document**
- Document: file uploads (existing)
- RedactionDocument: Tiptap editing (new)  
**Why**: Different workflows, avoids schema collision.

### 3. **Task Renamed from DossierTache**
Extended with automation + parent-child chaining.  
**Why**: Better semantics, supports complex workflows.

### 4. **Force-Active-Task Rule (MANDATORY)**
Cannot close dossier without Task.status = IN_PROGRESS.  
**Why**: Prevents ghost cases, ensures explicit transitions.

### 5. **BullMQ + Redis**
Single queue handles automation, email, SMS, notifications.  
**Why**: Consistent infrastructure, persistent, retry logic, monitoring included.

### 6. **AI Integration**
Claude API for document suggestions (grammar, tone, legal templates).  
**Why**: Reduces review time, improves document quality.

---

## Task Sequencing

Critical path:
1. Phase 1.1 (migration) → everything depends on it
2. Phase 1.2-1.3 (templates + staging validation) → Phase 2 unblocked
3. Phase 2 can run in parallel with Phase 3 prep
4. Phase 3.1 (BullMQ setup) → automation rules unblocked
5. Phase 4 depends on Phases 2-3 foundation (documents + tasks exist)

See `implementation-plan-unified-modules.md` for full dependency graph per task.

---

## Success Metrics

**Phase 1**: Migration runs, templates seeded, zero errors.  
**Phase 2**: 2-3 users create/edit documents with AI suggestions, PDF export works.  
**Phase 3**: Tasks visible in Kanban, Calendar displays 100+ events, force-active-task rule enforced.  
**Phase 4**: Invoice = sum(TimeEntry), Trust balance = sum(Transactions), audit log 100%.

---

## Next Step: Ready?

The unified schema is committed. The detailed plan is written.

**Option A**: Start Phase 1.1 immediately (create migration, seed templates).  
**Option B**: Review the detailed plan first, clarify any questions.  
**Option C**: Start a different area (frontend prep for Phase 2/3, Redis setup for Phase 3).

Which would you prefer?

---

## Key Files

- **Unified Schema**: `prisma/schema.prisma.unified`
- **Detailed Plan**: `planning/implementation-plan-unified-modules.md`
- **This Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Memory**: `.claude/projects/-Users-Bookkeeping-SAAS---SAFE-02/memory/project_module_integration.md`

---

**Estimated Effort**: 160-200 developer-hours over 6-8 weeks.  
**Risk Level**: Medium (database migration, complex automation rules). Mitigated by staging tests, rollback plans, audit trails.
