---
name: ux-writing
description: Use this skill whenever the user needs to write, review, or improve UX microcopy — including error messages, button labels, empty states, confirmation dialogs, tooltips, onboarding text, AI feature copy, loading states, or any user-facing interface text. Also trigger when the user asks about UX writing best practices, tone of voice calibration, i18n/localization text constraints, or wants to audit existing microcopy for conversion and clarity. If the user mentions "microcopy", "UX copy", "button text", "error message", "empty state", "tooltip copy", "confirmation dialog", or "interface text", use this skill.
---

# UX Writing & Microcopy

This skill provides precise, research-backed formulas for writing interface text that reduces friction, increases conversion, and meets design system standards.

## Core Principle

Every piece of microcopy must pass this test: **Does the user understand what happened and what to do next — in under 3 seconds?**

Baymard Institute (2024) found that 70% of cart abandonment links to confusing forms and vague errors. Improving checkout copy alone can lift conversion by 35%.

---

## Error Messages

Use the universal formula: `[What happened] + [What to do next]`

### Severity tiers

1. **Inline validation** — fires immediately at the field level.
   - Example: "Enter a valid email address"
2. **Form-level errors** — summary at top + inline indicators per field.
   - Example: "2 fields need your attention" with red outlines on the relevant fields
3. **System errors** — acknowledge problem + offer recovery path.
   - Example: "We couldn't save your changes. Check your connection and try again."
4. **Fatal errors** — explanation + alternative action + support link.
   - Example: "This page isn't available right now. Go back to the dashboard or contact support."

### Rules

- Never blame the user: write "That password doesn't match" not "You entered the wrong password."
- No exclamation marks on negative messages (IBM Carbon mandate).
- Use the least conversational tone — short phrases, maximum economy.
- Always provide a recovery action — never leave the user in a dead end.

---

## Button Labels

Use the `[Verb] + [Object]` formula.

| Instead of      | Write              | Why                                      |
|-----------------|--------------------|------------------------------------------|
| Submit          | Send invoice       | +18% click-through (verb+object)         |
| Register        | Get your free account | +28% conversion                       |
| Request a quote | Request pricing    | +166% conversion lift                    |

### Rules

- Stay under 20 characters.
- Use sentence-case capitalization.
- For destructive actions, name the specific action: `[Cancel]` `[Delete Project]` — never `[No]` `[Yes]`.
- Primary CTA gets visual emphasis. Secondary actions are visually subdued.

---

## Empty States

### First-use states

Formula: `[What this area is for] + [Clear CTA to get started]`

Include an illustration. This is an onboarding opportunity, not a dead end.

Example: "No invoices yet. Create your first invoice to start getting paid."

### No-results states

Formula: `[Acknowledge no results] + [Suggest alternatives]`

Example: "No results for 'acme'. Try a different search term or browse all clients."

---

## Confirmation Dialogs (Destructive Actions)

Template:
- **Title**: Question stating the action → "Delete this project?"
- **Body**: Explain consequences → "All files and comments will be permanently removed. This cannot be undone."
- **Primary button**: Name the specific destructive action → "Delete project"
- **Secondary button**: Always provide Cancel.

---

## Tooltips

- Stay under 150 characters (1–2 short sentences).
- Never contain essential information — use inline text for that.
- Inappropriate for mobile-primary interfaces (no hover exists).

---

## AI Feature Copy

Five rules govern AI-related microcopy:

1. Explicitly state what AI can and cannot do.
2. Keep humans as final decision-makers — provide clear affordances to edit or discard.
3. Use progressive disclosure: simple defaults → advanced options.
4. Show citations and confidence indicators.
5. Be transparent about what data is being used.

### AI Loading States

Use this hierarchy based on operation complexity:

- Brief: "Searching…"
- Contextual: "Analyzing your data…"
- Time-setting: "This usually takes a few seconds"
- Engaging: "Finding the best matches for you…"

Standard AI disclaimer: "AI-generated content may contain errors. Please verify important information."

Use labels like "Suggested by AI" with badges or chips.

---

## Tone of Voice Calibration

Use Nielsen Norman Group's 4-dimension framework:

| Dimension                    | Spectrum                    |
|------------------------------|-----------------------------|
| Humor                        | Funny ↔ Serious             |
| Formality                    | Formal ↔ Casual             |
| Respect                      | Respectful ↔ Irreverent     |
| Energy                       | Enthusiastic ↔ Matter-of-fact|

Context shifts:
- **Onboarding**: playful, enthusiastic
- **Errors**: empathetic, serious
- **Success**: celebratory, casual
- **Financial/Healthcare**: formal, serious (trustworthiness is the strongest predictor of willingness to recommend)

IBM Carbon maps 6 conversational levels: onboarding = most conversational (full sentences, friendly), error messages = least conversational (short phrases, maximum economy).

---

## Design System Writing Constraints

These rules are shared across Material Design, Polaris, Carbon, and Atlassian:

- Target 7th grade reading level.
- Sentences ≤ 25 words.
- Sentence-style capitalization everywhere.
- Use contractions ("don't" not "do not").
- Present tense ("Message sent" not "Message has been sent").
- Start with verbs when possible.
- Eliminate every word that isn't load-bearing. Polaris test: "What's the most you can take away before things fall apart?"
- If a sentence describes objective + action, start with the objective: "To see item properties, tap its name."

---

## Localization / i18n Constraints

When writing copy destined for translation:

- Design for 30–50% text expansion from English (German expands 30–40%).
- Never concatenate strings programmatically.
- Avoid string reuse across contexts ("Bookmark" is both noun and verb).
- Use ICU MessageFormat for plurals (Arabic has 6 plural forms).
- Externalize all user-facing text to .json/.po/.xliff files.
- Use logical CSS properties (`margin-inline-start` not `margin-left`) for RTL support.
- Run pseudo-localization testing before real translation to catch UI breakage.
