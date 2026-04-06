---
name: competitive-ux
description: Use this skill whenever the user wants to conduct a competitive UX analysis, benchmark their product against competitors, build a UX comparison matrix, define UX metrics, or create a UX roadmap based on competitive gaps. Trigger when the user mentions "competitive analysis", "UX benchmark", "competitor comparison", "HEART framework", "SUS benchmark", "UX metrics", "NPS", "task success rate", "feature comparison matrix", "UX roadmap", or asks how their product stacks up against others or what UX patterns competitors use.
---

# Competitive UX Analysis

This skill provides the industry-standard 6-step framework for competitive UX analysis, the HEART metrics framework, scoring matrices, and pattern library sources.

---

## The 6-Step Process

### Step 1: Define Objectives & Scope

Identify which user journeys matter most. Focus on flows that directly impact business KPIs (onboarding, checkout, core feature usage). Don't try to audit everything — pick 2–3 critical flows.

### Step 2: Identify 3–5 Competitors

Select across three categories:

- **Direct competitors** — same market, same users
- **Indirect competitors** — different product, same user need
- **Aspirational competitors** — best-in-class UX from adjacent markets

### Step 3: Define Evaluation Criteria

Standard criteria set: usability, visual design, content quality, performance, accessibility, engagement, innovation. Weight each based on business priority (1x for nice-to-have, 3x for critical).

### Step 4: Gather Data

Two methods:

- **Heuristic evaluation** — 3–5 independent evaluators per competitor
- **Usability testing** — 5–8 participants per competitor (moderated), 20–30 (unmoderated)

Evaluators must complete realistic tasks, not passively browse. Map every observation to a specific heuristic.

### Step 5: Synthesize Findings

Produce: SWOT analysis per competitor, comparative matrix, and gap map. Include a "Positive Findings" section — what competitors do well that you should learn from.

### Step 6: Create Prioritized UX Roadmap

Link each gap to a KPI. Prioritize by impact × feasibility. The roadmap is the deliverable — not the analysis itself.

---

## Google's HEART Framework

Five dimensions for measuring UX quality:

| Dimension      | What it measures                  | Example Metrics                          |
|----------------|-----------------------------------|------------------------------------------|
| **Happiness**  | Satisfaction, perceived ease      | NPS, CSAT, ease-of-use survey            |
| **Engagement** | Depth and frequency of use        | Sessions per user/week, features used    |
| **Adoption**   | New users and feature uptake      | Registration rate, feature adoption rate |
| **Retention**  | Users who come back               | Churn rate, 7/30/90-day retention        |
| **Task Success** | Efficiency and effectiveness    | Completion rate, time-on-task, error rate|

### Goals-Signals-Metrics (GSM) Process

For each HEART dimension:
1. **Goal** — What do you want to achieve?
2. **Signal** — What user behavior indicates success/failure?
3. **Metric** — How do you quantify the signal?

### Important Tension

HEART categories exist in natural tension. Optimizing task success (efficiency) may conflict with happiness (delight). Select 2–4 relevant dimensions per analysis, not all five.

---

## Heuristic Comparison Matrix

### Structure

Competitors as columns. Nielsen's 10 heuristics (or custom criteria) as rows.

### Scoring

| Score | Label          |
|-------|----------------|
| 1     | Very poor      |
| 2     | Below average  |
| 3     | Average        |
| 4     | Good           |
| 5     | Best-in-class  |

Multiply score × weight for final ranking. Use traffic-light scoring (Green/Yellow/Red) for stakeholder communication, with detailed 1–5 underneath.

### Matrix Template

```
| Criterion           | Weight | Product A | Product B | Product C | You |
|----------------------|--------|-----------|-----------|-----------|-----|
| System status (H1)  | 2x     | 4 (8)    | 3 (6)    | 5 (10)   |     |
| User control (H3)   | 3x     | 3 (9)    | 4 (12)   | 4 (12)   |     |
| Error prevention (H5)| 3x    | 2 (6)    | 4 (12)   | 3 (9)    |     |
| ...                  |        |           |           |           |     |
| **TOTAL**            |        | **23**    | **30**    | **31**    |     |
```

---

## Benchmark Sources

Four reference points for benchmarking:

1. **Previous version** of your product (internal improvement)
2. **Competitor products** (relative position)
3. **Industry standards** (absolute quality)
4. **Stakeholder-set goals** (business alignment)

### Key Benchmark Databases

- **MeasuringU** — Industry-standard SUS studies across banking, airlines, hotels, retail.
- **Baymard Institute** — 250+ e-commerce sites against 700+ UX guidelines with 275,000+ weighted performance scores. 2024 SaaS benchmark: 10 subscription services across 240+ parameters.

---

## Pattern Libraries for Research

| Source          | What it offers                                                  |
|-----------------|-----------------------------------------------------------------|
| Mobbin          | 100,000+ searchable screenshots, search by specific flow type  |
| Page Flows      | 5,000+ full-screen video recordings with step-by-step annotations |
| Growth.Design   | Interactive case studies explaining *why* decisions work using psychology |
| Baymard         | 175,000+ best/worst practice examples for e-commerce           |

Use these to study specific flows (onboarding, checkout, settings) across real production apps rather than relying on Dribbble-style inspiration.
