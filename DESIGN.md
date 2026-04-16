# Design System — CodexFlow

## Product Context
- **What this is:** CodexFlow is a review-first interface for AI coding runs. It turns a request into context selection, prompt preview, patch preview, verification evidence, and operator review.
- **Who it's for:** Engineers, founders, and demo audiences evaluating whether an AI coding run is trustworthy.
- **Space/industry:** Developer tools, agent workflow, internal execution dashboards.
- **Project type:** Web app with a marketing landing page, kanban board, modal-based task intake, and dense task detail pages.

## Aesthetic Direction
- **Direction:** Refined operational SaaS.
- **Decoration level:** Intentional, not expressive.
- **Mood:** Calm, expensive, proof-oriented. Closer to a polished infra dashboard than a flashy AI product page.
- **Reference style:** Premium B2B SaaS with warm neutrals, restrained accent color, subtle glass, and strong spacing discipline.

## Typography
- **Display/Hero:** Söhne / Avenir Next / SF Pro Display fallback stack.
- **Body:** Same stack for continuity and implementation simplicity.
- **UI/Labels:** Same stack, medium weight.
- **Data/Tables:** Berkeley Mono / SF Mono / Menlo fallback stack.
- **Code:** Berkeley Mono / SF Mono / Menlo fallback stack.
- **Scale:** 12, 14, 16, 18, 24, 32, 48px with tight tracking on headlines.

## Color
- **Approach:** Restrained.
- **Primary:** `#191713`, used for primary CTA, dense headers, and high-emphasis text.
- **Accent:** `#0f766e`, used sparingly for focus rings and trustworthy state accents.
- **Neutrals:** `#fcfaf6`, `#f9f6f1`, `#f4f0e9`, `#ece4d8`, `#ddd5ca`, `#6f675d`, `#1f1c17`.
- **Semantic:** success `#277a46`, warning `#a56b08`, error `#a64646`, review `#7a4fc8`.
- **Dark mode:** Not implemented yet. Current system is light-first and should stay coherent before adding a second theme.

## Spacing
- **Base unit:** 8px.
- **Density:** Comfortable, but not airy.
- **Scale:** 4, 8, 12, 16, 24, 32, 48, 64.

## Layout
- **Approach:** Grid-disciplined with selective soft-card framing.
- **Max content width:** 1280px.
- **Border radius:** 18px for controls, 22-28px for cards, 34px for hero frames.
- **Guideline:** Keep chrome quiet. Content should feel organized by hierarchy, not ornament.

## Motion
- **Approach:** Minimal-functional.
- **Easing:** ease-out for hover and entrance, no theatrical motion.
- **Duration:** 150-220ms for hover/focus/press states.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-16 | Switched to a warm light design system | The prior dark/light mix made the board and modal feel incoherent and cheaper than the product intent. |
| 2026-04-16 | Chose restrained neutrals plus one deep accent | This keeps the UI looking premium and avoids generic AI-product gradients. |
