---
name: dark-patterns-compliance
description: Use this skill whenever the user needs to audit, prevent, or comply with regulations around deceptive design patterns (dark patterns). Trigger when the user mentions "dark patterns", "deceptive design", "cookie consent", "GDPR consent", "FTC compliance", "Digital Services Act", "confirmshaming", "roach motel", "hidden fees", "drip pricing", "ethical design", "consent design", "cancel flow", "subscription cancellation UX", or asks about making an interface legally compliant, ethically sound, or free from manipulative design. Also use when reviewing checkout flows, subscription sign-up/cancellation flows, or cookie banners for compliance.
---

# Dark Patterns: Compliance & Ethical Design

This skill provides the taxonomy of deceptive patterns, current regulatory requirements with enforcement examples, compliance checklists, and ethical design frameworks.

---

## Why This Matters Now

Regulatory enforcement has escalated dramatically in 2024–2025:

- **FTC vs. Amazon Prime** (Sept 2025): $2.5 billion — largest civil penalty in FTC history — for deceptive enrollment and obstructed cancellation.
- **CNIL vs. Google** (Sept 2025): €325 million for asymmetric cookie consent.
- **CNIL vs. SHEIN** (Sept 2025): €150 million for cookie consent violations.
- 97% of most popular EU websites deploy at least one deceptive pattern.
- Estimated EU consumer detriment: €7.9 billion per year.

---

## The Deceptive Patterns Taxonomy

Seven categories (Mathur et al. / Harry Brignull):

### 1. Sneaking
Hidden costs, drip pricing, sneak items into basket. The user discovers charges they didn't expect.

### 2. Urgency
Countdown timers, false limited-time offers. Creates artificial time pressure.

### 3. Misdirection
Visual emphasis on the option the business prefers, confirmshaming ("No thanks, I don't like saving money").

### 4. Social Proof
Fake activity notifications ("12 people viewing this right now"), fabricated testimonials.

### 5. Scarcity
False "Only 2 left!" claims when stock is not actually limited.

### 6. Obstruction (Roach Motel)
Easy to subscribe, impossible to cancel. Asymmetric effort between enrollment and withdrawal.

### 7. Forced Action
Mandatory account creation, required newsletter subscription to access content.

### Scale of the Problem

DPGuard (ACM 2025) found 25.7% of mobile apps and 49% of websites feature at least one deceptive pattern across 21 identified categories.

---

## Regulatory Requirements

### EU Digital Services Act (Article 25)

Explicitly prohibits interfaces that "deceive or manipulate" users or "materially distort" their ability to make free and informed decisions. Penalties: up to **6% of annual worldwide turnover**. Active investigations target Meta, Temu, X, Shein, TikTok, AliExpress.

### EU AI Act (Article 5)

Separately prohibits subliminal and manipulative techniques through AI systems.

### US — FTC Enforcement

The Click-to-Cancel Rule was vacated by the Eighth Circuit in July 2025 for procedural failure, but enforcement continues under ROSCA, FTC Act Section 5, and state auto-renewal laws.

### California CCPA/CPRA

Consent obtained through dark patterns is **not valid consent**.

### India

First country to issue dedicated dark pattern guidelines (November 2023), explicitly prohibiting 13 named patterns including confirmshaming, basket sneaking, and false urgency.

---

## Cookie Consent Compliance Rules

After CNIL's September 2025 enforcement, the rules are unambiguous:

1. Accept and Reject buttons must have **identical size, color, and visual weight**.
2. One-click rejection must be available on the first screen.
3. No cookies may load before consent.
4. Consent withdrawal must be as simple as consent (one-click maximum).
5. No pre-ticked checkboxes.
6. No cookie walls conditioning access on acceptance.

Google has been fined three times for cookies alone (€100M in 2020, €150M in 2021, €325M in 2025).

---

## Compliance Audit Checklist

### The 8-Question Test

For each design decision, answer these:

1. Does the user understand what will happen?
2. Is the choice freely given?
3. Could a reasonable person be deceived?
4. Are accept/decline options symmetrical (same size, color, prominence)?
5. Is consent as easy to withdraw as to give?
6. Who benefits — user or only business?
7. Would you be comfortable with public scrutiny of this design?
8. Does it exploit cognitive biases?

If any answer raises concern, redesign before shipping.

### Subscription Flow Audit

Compare sign-up steps vs. cancellation steps. The number of steps and cognitive effort should be equivalent:

- **Sign up**: If it takes 2 clicks to subscribe...
- **Cancel**: ...it should take ≤ 2 clicks to cancel.

Count the number of screens, decisions, and friction points in each direction. Asymmetry is a regulatory risk.

### Checkout Flow Audit

- Are all fees visible before the final confirmation?
- Are any items pre-added to the cart?
- Is there a false urgency element (countdown timer)?
- Are upsells opt-in (not pre-selected)?

---

## Ethical Design Frameworks

### Consequence Scanning (Salesforce method)

1. Assemble a diverse group.
2. Brainstorm positive/negative and intended/unintended consequences.
3. Plot on a 2×2 grid: likelihood vs. concern.
4. Score risks.
5. Create action items.

Key questions: "What could this mean for well-being?" and "How would communities be affected if everyone did this?"

### Ind.ie Ethical Design Manifesto

Maslow-like pyramid:
- **Base**: Respects human rights (privacy, no surveillance capitalism)
- **Middle**: Respects human effort (functional, reliable)
- **Top**: Respects human experience (beautiful, delightful)

---

## Automated Detection

Tools for ongoing compliance monitoring:

- **DPGuard** — Multimodal LLMs (CV + NLP), F1-score 0.73 for mobile detection.
- **Fair Patterns Screening** — Processes thousands of screenshots for button asymmetry and visual tricks.

### Monthly Monitoring Methodology

1. Heuristic audit of key flows
2. Automated DOM scanning (countdown timers, pre-ticked boxes, asymmetric buttons)
3. NLP content analysis (flagging confirmshaming language)
4. Session replay analysis
5. Cart/checkout monitoring for hidden fees
6. Funnel analytics: sign-up steps vs. cancellation steps

Baseline compliant interfaces and detect drift monthly.
