---
name: design-to-code
description: Use this skill whenever the user needs guidance on translating designs into production code — including design tokens, CSS architecture decisions, component library selection, Figma-to-code handoff, animation implementation, or building accessible components. Trigger when the user mentions "design tokens", "Tailwind vs CSS-in-JS", "headless components", "Figma handoff", "design system implementation", "CSS architecture", "View Transitions API", "Motion/Framer Motion", "W3C design tokens", "React Aria", "Radix UI", or any question about bridging design and frontend code.
---

# Design-to-Code: Tokens, CSS, Components & Animation

This skill provides decision frameworks and implementation patterns for translating designs into production-quality frontend code.

---

## Design Tokens — W3C Specification (2025.10 Stable)

The W3C Design Tokens specification standardizes a vendor-neutral JSON format.

### Token Structure

```json
{
  "color": {
    "blue": {
      "500": {
        "$value": "#3B82F6",
        "$type": "color",
        "$description": "Primary brand blue"
      }
    }
  }
}
```

Properties: `$value` (required), `$type`, `$description`. Supports Display P3/Oklch color spaces. Theming via `$extensions` and group inheritance.

### Three-Layer Token Architecture

This structure eliminates theme duplication:

1. **Primitives** — Raw values. Example: `color.blue.500: #3B82F6`
2. **Semantic tokens** — Aliases by purpose. Example: `color.background.primary: {color.white}`
3. **Component-specific tokens** — Example: `button.background.primary: {color.background.primary}`

Dark mode overrides only the semantic layer. Primitives stay unchanged.

### Production Workflow

Define tokens in Tokens Studio (Figma plugin, W3C format support) → Sync with Figma for visual testing → Push to Git → Transform with Style Dictionary v4 (forward-compatible with DTCG spec) → Distribute as CSS custom properties, JS, iOS, Android → Publish as npm package.

---

## CSS Approach Decision Framework

### Decision Matrix

| Scenario                                  | Recommended Approach            |
|-------------------------------------------|---------------------------------|
| New project, speed priority               | Tailwind CSS                    |
| Existing large codebase, scoping needed   | CSS Modules                     |
| Type-safety + zero runtime                | Panda CSS or Vanilla Extract    |
| Meta-scale atomic CSS                     | StyleX                          |
| Hybrid (common pattern)                   | Tailwind for utilities + CSS Modules for complex components |

### Why Runtime CSS-in-JS is Declining

Styled-components and Emotion carry runtime costs that impact Core Web Vitals and are incompatible with React Server Components. Material UI is actively migrating away from Emotion.

### Tailwind CSS (v4)

Dominates new projects. Compile-time only, no runtime overhead, enforces design system constraints. Downsides: verbose JSX, no true component-level encapsulation.

### Zero-Runtime CSS-in-JS

- **Panda CSS** (from Chakra UI's creator) — CSS-in-JS DX, zero runtime, RSC compatible.
- **Vanilla Extract** — TypeScript-first theming.
- **StyleX** (Meta) — Atomic CSS at Facebook scale.

---

## Figma Dev Mode Handoff

### Structuring Figma Files for Clean Handoff

- Use Auto Layout consistently (maps directly to Flexbox).
- Name layers semantically: `Btn/Primary/Active` → component/class names.
- Use Components with Variants for interactive states (map to React props).
- Apply Figma Variables for design tokens.
- Never detach components.

### Component Variant → React Props Mapping

| Figma Property               | React Prop                                     |
|------------------------------|-------------------------------------------------|
| Boolean property `hasIcon`   | `hasIcon?: boolean`                             |
| Enum property `size`         | `size: 'small' \| 'medium' \| 'large'`         |

AI-powered code generation (Builder.io Visual Copilot, Anima, Locofy) gets about 80% accuracy. None eliminate manual refinement.

---

## Headless Component Libraries

The headless pattern separates logic (state, keyboard nav, ARIA, focus) from visual presentation.

### Library Selection

| Library         | Strength                                      | Best paired with |
|-----------------|-----------------------------------------------|-------------------|
| React Aria      | Most comprehensive (50+ components), full ARIA, i18n in 30+ languages | Any CSS approach |
| Radix UI        | Best DX, composable primitives                | Tailwind          |
| Headless UI     | Simplest API, smallest surface area           | Tailwind          |
| ARIAKit         | Powers WordPress Gutenberg, React 19 ready    | Any               |

### Critical Accessibility Patterns in Code

- **Focus trap** for modals: focus contained within, `aria-modal="true"`, close on Escape.
- **Focus restoration**: return focus to trigger element on close.
- **Route announcer** for SPAs: announce page changes via `aria-live="polite"`.
- **Skip links** for keyboard users.

### Testing Stack

- `eslint-plugin-jsx-a11y` — AST linting (catches issues at build time)
- `@axe-core/react` — Runtime checking
- `@testing-library/react` — User-centric with `getByRole`
- Manual screen reader testing: NVDA, VoiceOver, TalkBack

---

## Animation

### Motion Library (formerly Framer Motion)

Import: `motion/react`

Key patterns:
- `AnimatePresence` — mount/unmount animations
- `layout` prop — smooth layout changes
- `layoutId` — shared element transitions across components
- `variants` — orchestrated staggered animations
- `whileInView` — scroll-triggered effects

### View Transitions API

Reached Baseline status October 2025 (~89% global browser coverage for same-document transitions). Chrome 111+, Safari 18+, Firefox 144+. Cross-document transitions: Chrome 126+, Safari 18.2+, not Firefox.

RUM data shows View Transitions add ~70ms to LCP on mobile — consider restricting to desktop via media query.

### Animation Performance Rules

- Animate ONLY `transform`, `opacity`, and `filter` (GPU-accelerated).
- NEVER animate `width`, `height`, `top`, `left`, `margin`, `padding`.
- Always implement `prefers-reduced-motion`:
  - Wrap `view-transition-name` in `@media (prefers-reduced-motion: no-preference)`.
  - Use Motion's `useReducedMotion()` hook.
