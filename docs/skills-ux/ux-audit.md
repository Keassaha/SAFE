---
name: ux-audit
description: Use this skill whenever the user wants to audit, evaluate, or score a user interface for usability, accessibility, or UX quality. This includes heuristic evaluations (Nielsen, Shneiderman, Gerhardt-Powals), cognitive walkthroughs, WCAG 2.2 compliance checks, SUS scoring, accessibility audits, or any systematic UX review. Trigger when the user mentions "UX audit", "heuristic evaluation", "usability review", "accessibility check", "WCAG", "SUS score", "cognitive walkthrough", "usability testing", or asks to identify usability problems in an interface.
---

# UX Audit Frameworks

This skill provides structured scoring systems, severity scales, and checklists for evaluating interface usability, accessibility, and UX quality.

---

## Nielsen's 10 Heuristics — Modern Evaluation

The 10 heuristics are grounded in fundamental human-machine mismatches, not specific technologies. Their modern applications have evolved:

### The 10 Heuristics with 2025 Applications

1. **Visibility of system status** — skeleton screens, streaming response indicators, AI processing animations. The system must always keep users informed.
2. **Match between system and real world** — use language, concepts, and conventions familiar to the user. Follow real-world ordering.
3. **User control and freedom** — undo/redo, AI response regeneration, easy subscription cancellation. Users need a clear "emergency exit."
4. **Consistency and standards** — follow platform conventions. Users shouldn't wonder whether different words or actions mean the same thing.
5. **Error prevention** — extends to AI guardrails preventing harmful outputs, biometric authentication fallbacks, confirmation before destructive actions.
6. **Recognition rather than recall** — make elements, actions, and options visible. Minimize memory load.
7. **Flexibility and efficiency of use** — shortcuts for expert users, personalization, progressive disclosure.
8. **Aesthetic and minimalist design** — every extra unit of information competes with relevant units. Remove the unnecessary.
9. **Help users recognize, diagnose, and recover from errors** — plain language, indicate the problem precisely, suggest a fix.
10. **Help and documentation** — easily searchable, focused on the user's task, concise, with concrete steps.

### Severity Rating Scale (0–4)

| Score | Label       | Description                                          |
|-------|-------------|------------------------------------------------------|
| 0     | Not a problem | Agreed not to be a usability problem                |
| 1     | Cosmetic    | Fix only if extra time available                     |
| 2     | Minor       | Low priority fix                                     |
| 3     | Major       | Important to fix — high priority                     |
| 4     | Catastrophe | Imperative to fix before release                     |

Severity = **Frequency × Impact × Persistence**

Use 3–5 independent evaluators. The "evaluator effect" is a known bias — evaluators rate their own findings as more severe. Always use 2+ raters and reconcile. Issues rated 3–4 are imperative to fix. Issues rated 1–2 are low priority.

---

## Complementary Frameworks

### Shneiderman's 8 Golden Rules

Focus on interaction mechanics:

1. Strive for consistency
2. Enable shortcuts for frequent users
3. Offer informative feedback (users wait 3× longer with continuous feedback vs. none)
4. Design dialogs for closure
5. Offer simple error handling
6. Permit easy reversal of actions
7. Support internal locus of control
8. Reduce short-term memory load (7±2 chunk rule — Apple's 4-icon bottom bar exemplifies this)

### Gerhardt-Powals' 10 Cognitive Engineering Principles

For cognitive load assessment:

1. Automate unwanted workload
2. Reduce uncertainty
3. Fuse data into higher-level summaries
4. Use conceptually related names
5. Group data consistently
6. Limit data-driven tasks
7. Include only currently needed information
8. Provide multiple codings (visual + textual)
9. Practice judicious redundancy
10. Use names that are specific and familiar

---

## Cognitive Walkthrough: The 4-Question Method

At each step in a task flow, evaluators answer:

- **Q1**: Will the user try to achieve the right effect?
- **Q2**: Will the user notice the correct action is available?
- **Q3**: Will they associate the correct action with their intended effect?
- **Q4**: If performed correctly, will they see progress toward their goal?

Each gets a Yes/No with rationale. Streamlined version (Spencer, 2000) reduces to two: "Will they know what to do?" and "Will they know they did the right thing?"

Typically 2 full tasks can be evaluated in a 90-minute session with 2–6 evaluators.

---

## WCAG 2.2 Compliance Checklist

Published October 5, 2023. Adds 9 criteria to WCAG 2.1, removes SC 4.1.1 Parsing. The most impactful for everyday development:

### Level A (Minimum)

- **Redundant Entry (3.3.7)** — Auto-populate previously entered information. No re-typing shipping addresses.
- **Focus Not Obscured (2.4.11)** — Keyboard focus must not be completely hidden by sticky headers or modals.

### Level AA (Target Standard)

- **Target Size Minimum (2.5.8)** — Interactive targets ≥ 24×24 CSS pixels.
- **Accessible Authentication (3.3.8)** — No cognitive function tests (remembering passwords, solving puzzles) unless alternatives exist. Support password managers, biometrics, email links.
- **Dragging Movements (2.5.7)** — Single-pointer alternatives for any drag functionality.
- **Consistent Help (3.2.6)** — Help mechanisms in the same relative order across pages.
- **Focus Not Obscured Enhanced (2.4.12)** — Focus indicator must be fully visible (not just partially).

### Automated vs Manual Testing

Automated tools detect ~30% of WCAG success criteria but catch 57% of accessibility issues by volume (Deque study, 13,000+ pages). Color contrast alone accounts for 30% of all issues and is highly automatable.

**Automated tools**: axe-core (70+ tests, zero false positives), WAVE (most effective at critical issues), Accessibility Insights (highest WCAG criteria coverage + guided manual testing).

**The remaining 43% requires manual testing**: alt text quality, keyboard navigation flow, screen reader experience, focus management in dynamic content, complex ARIA implementations.

---

## SUS (System Usability Scale) Scoring

The 10-item questionnaire yields a 0–100 score.

### Scoring Method

- Odd items (1, 3, 5, 7, 9): score = response − 1
- Even items (2, 4, 6, 8, 10): score = 5 − response
- Sum all 10 scores, multiply by 2.5

### Benchmarks

| Score    | Grade | Percentile | Interpretation     |
|----------|-------|------------|--------------------|
| 90+      | A+    | Top 5%     | Best imaginable    |
| 80–89    | A     | Top 10–15% | Industrial target  |
| 68       | C     | 50th       | Average            |
| Below 60 | F     | Bottom 15% | Failing            |

- Minimum 15–30 respondents needed for statistical confidence.
- Differences of 5–8+ points are meaningful; 2-point differences are not.

---

## Audit Output Template

When conducting a UX audit, structure findings as:

```
## Finding #[N]
- **Heuristic**: [Which heuristic is violated]
- **Severity**: [0–4]
- **Location**: [Where in the interface]
- **Issue**: [What's wrong]
- **Impact**: [How it affects users]
- **Recommendation**: [How to fix it]
- **Evidence**: [Screenshot, data, or user quote if available]
```

Prioritize by severity descending. Group by heuristic or by screen/flow depending on audience.
