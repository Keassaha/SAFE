---
name: user-flow-mapping
description: Use this skill whenever the user wants to map, design, or analyze user flows, task flows, wireflows, or state machines for a product or feature. Trigger when the user mentions "user flow", "task flow", "wireflow", "state machine", "XState", "user journey mapping", "flow diagram", "edge cases", "onboarding flow", "checkout flow", "authentication flow", or asks about modeling complex SaaS interactions, handling edge cases systematically, or structuring multi-step user experiences.
---

# User Flow Mapping: From Diagrams to State Machines

This skill provides frameworks for mapping user journeys, selecting the right flow type, modeling with state machines, and systematically identifying edge cases.

---

## Flow Type Selection

Start by choosing the right abstraction level:

| Flow Type    | What it models                              | When to use                                  |
|--------------|---------------------------------------------|----------------------------------------------|
| Task flow    | Single linear path, no branching            | Universal tasks (e.g. "Sign Up"), early planning |
| User flow    | Decision points + multiple branches         | Mapping all possible paths for a persona     |
| Wireflow     | Wireframe screens attached to each node     | Dynamic interfaces where content changes based on interaction |

The progression is hierarchical: start with task flow → expand to user flow → detail with wireflow.

### Standard Notation (ANSI/ISO)

- **Ovals** — start/end points
- **Rectangles** — screens or actions
- **Diamonds** — decision points
- **Arrows** — sequence/direction

Color-code branches by persona or outcome.

---

## State Machines for Complex SaaS Flows

State machines eliminate impossible states — no more `isLoading && isError` simultaneously. Each state and transition can be unit tested in isolation.

### XState v5 Patterns

XState v5 uses the actor model with zero dependencies. The `setup()` API defines actors, actions, guards, and delays with automatic TypeScript type inference.

### Common SaaS Flow Models

**Authentication:**
```
idle → authenticating → authenticated | error
  Sub-states: sessionExpired, passwordReset, mfaChallenge
```

**Onboarding:**
```
checkingAccount → loggedIn | onboarding
  Sub-states: personalInfo → preferences → teamSetup → complete
```

**Checkout:**
```
cart → shipping → payment → processing → confirmation | paymentFailed
  Guards: retry limit, minimum cart value
```

### When to Use State Machines

- Multi-step flows with branching logic
- States that are mutually exclusive (loading vs. error vs. success)
- Flows that need to be tested and verified
- Long-lived workflows (onboarding sequences spanning days/weeks)

Stately Studio provides visual editing that exports to TypeScript. Restate + XState enables persistent serverless state machines for long-lived workflows.

---

## Systematic Edge Case Identification

### Seven Discovery Methods

1. **"What If?" analysis** — At each flow node: what can go wrong? What if the user does X instead of Y? What if the server doesn't respond?
2. **Persona-based discovery** — Create extreme personas: users with disabilities, non-native speakers, users on ancient devices, users in crisis.
3. **Support ticket mining** — Analyze recurring "I can't do X" patterns.
4. **AI-assisted brainstorming** — Generate candidate edge cases for evaluation.
5. **Competitive analysis** — How do competitors handle the same edge cases?
6. **Technical constraint mapping** — Network, concurrency, session limits.
7. **Regulatory requirements** — GDPR deletion, data retention, consent flows.

### Edge Case Categories

| Category     | Examples                                                       |
|--------------|----------------------------------------------------------------|
| Data         | Empty states, extreme data volumes, missing fields, rare formats |
| User state   | Name changes, account lockouts, deceased users                 |
| Technical    | Network loss, concurrent editing, session timeouts             |
| Security     | Bad actors, phishing attempts, GDPR deletion requests          |
| Permissions  | Role changes mid-workflow, expired subscriptions during active use |

### Prioritization

Score each edge case on:
- **User impact severity** (1–5)
- **Frequency of occurrence** (1–5)
- **Feasibility of fix** (1–5)
- **Brand risk** (1–5)

Priority = Impact × Frequency × Brand Risk / Feasibility

Not all edge cases need solving. Differentiate between cases requiring resolution and those safely deferred. Document deferred cases with rationale.

---

## Flow Documentation Template

When documenting a user flow, include:

```
## Flow: [Name]
### Context
- **User**: [Who is performing this flow]
- **Goal**: [What they're trying to accomplish]
- **Entry point**: [How they arrive]
- **Success state**: [What "done" looks like]

### Happy Path
[Step-by-step sequence]

### Alternative Paths
[Decision points and branches]

### Edge Cases
[Identified edge cases with handling strategy]

### Error States
[What can go wrong and recovery paths]

### Metrics
[How to measure success of this flow]
```
