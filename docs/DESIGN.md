# Design System Document: High-End Editorial SaaS

## 1. Overview & Creative North Star: "The Digital Curator"

This design system moves beyond the utility of a standard job-hunting tool to become a premium, editorial experience. Our Creative North Star is **"The Digital Curator."** 

In an industry often cluttered with stressful, dense interfaces, we prioritize high-contrast typography, intentional white space, and sophisticated tonal layering. We reject the "template" look characterized by rigid grids and heavy borders. Instead, we use **intentional asymmetry** and **overlapping surfaces** to create an interface that feels bespoke and authoritative. By treating a resume or job application as a curated piece of content rather than a database entry, we empower the user with a sense of calm efficiency and professional mastery.

---

## 2. Colors: Depth and Soul

The palette is anchored in deep navies and professional blues, punctuated by high-vibrancy accents. However, the application of these colors is where the "premium" feel is forged.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section content. Boundaries must be defined solely through background color shifts. Use `surface-container-low` (#f2f4f6) sections sitting on a `surface` (#f7f9fb) background. This creates a soft, modern transition that avoids the "boxed-in" feeling of legacy SaaS.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine paper or frosted glass.
*   **Base:** `surface` (#f7f9fb)
*   **Sectioning:** `surface-container-low` (#f2f4f6)
*   **Cards/Primary Floating Elements:** `surface-container-lowest` (#ffffff)
*   **Utility/Internal UI:** `surface-container-high` (#e6e8ea)

### The "Glass & Gradient" Rule
To add visual "soul," use a subtle gradient for main CTAs or Hero backgrounds transitioning from `primary` (#000000—treated here as deep midnight) to `on-primary-container` (#607cec). For floating modal overlays or secondary navigation, use **Glassmorphism**: semi-transparent `surface` colors with a `backdrop-blur` of 12px–20px to let background tones bleed through softly.

---

## 3. Typography: Editorial Authority

We use a dual-font system to balance character with extreme readability.

*   **Display & Headlines (Manrope):** This is our "Editorial" voice. Use `display-lg` (3.5rem) and `headline-md` (1.75rem) to create clear entry points. The geometric nature of Manrope feels modern and architectural.
*   **Body & Labels (Inter):** This is our "Utility" voice. Inter provides world-class legibility for dense information like resumes and job descriptions.
*   **Visual Hierarchy:** Use `on-surface-variant` (#45464d) for secondary body text to create a clear distinction from primary titles. Never settle for "all black" text; use the tonal range to guide the eye from the headline to the supporting data.

---

## 4. Elevation & Depth: Tonal Layering

We avoid traditional structural lines by using atmospheric depth.

*   **The Layering Principle:** Depth is achieved by "stacking." A `surface-container-lowest` (#ffffff) card placed on a `surface-container-low` (#f2f4f6) background provides a natural lift.
*   **Ambient Shadows:** When an element must "float" (like a primary action button or a dragged resume component), use an extra-diffused shadow. 
    *   *Spec:* `offset-y: 8px, blur: 24px, color: rgba(25, 28, 30, 0.06)`. 
    *   Shadows should mimic natural light, tinted by the `on-surface` color, never a generic dark grey.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline-variant` (#c6c6cd) at **15% opacity**. High-contrast, 100% opaque borders are strictly forbidden.

---

## 5. Components: Refined Primitives

### Buttons
*   **Primary:** Vibrant Indigo-to-Navy gradient. `rounded-md` (0.75rem). Use `primary-fixed` (#dde1ff) for hover states to create a "glow" effect.
*   **Secondary:** `surface-container-lowest` (#ffffff) with a Ghost Border.
*   **Tertiary:** No background. Bold `label-md` text in `on-primary-fixed-variant` (#173bab).

### Cards & Lists
*   **Constraint:** Forbid the use of divider lines.
*   **Structure:** Separate list items using vertical white space from the Spacing Scale (specifically `spacing-4` or `1rem`). 
*   **Interactive State:** On hover, a card should shift from `surface-container-lowest` to a subtle Glassmorphism effect or a shadow-lift of 2px.

### Input Fields
*   **Default:** `surface-container-low` background with a subtle bottom-only `outline-variant` at 20% opacity.
*   **Focus:** Transition to a `surface-tint` (#3755c3) "Ghost Border" (20% opacity) and a slight elevation lift.
*   **Error:** Use `error` (#ba1a1a) for text and `error-container` (#ffdad6) for the input background to ensure the error is felt, not just seen.

### Custom Component: The "Resume Pulse"
For the resume tailoring app, use a **floating action chip** that follows the user's scroll. It uses `tertiary_fixed` (#6ffbbe) with a glassmorphism backdrop to indicate "AI Suggestions Available," providing a high-end, proactive feel.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical spacing (e.g., `spacing-12` on the left, `spacing-8` on the right) for dashboard headers to create an editorial layout.
*   **Do** use `on-tertiary-container` (#009668) for success states (e.g., "Resume Optimized") to maintain a professional, rather than "neon," look.
*   **Do** utilize `surface-bright` (#f7f9fb) to create "breathing room" between dense data sections.

### Don't
*   **Don't** use 1px solid black or dark grey dividers. They clutter the UI and break the premium feel.
*   **Don't** use `none` or `sm` roundedness. All interactive elements must use `md` (0.75rem) or `lg` (1rem) to feel approachable and modern.
*   **Don't** center-align long-form text. Keep it left-aligned to maintain the "Editorial" grid structure.