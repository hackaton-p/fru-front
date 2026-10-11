---
name: Plan de Packing · Pura Fruit
description: Weekly packing planning, approval, and daily execution for Pura Fruit plants.
colors:
  ground: "oklch(0.966 0.003 128.5)"
  ink: "oklch(0.239 0 0)"
  card-white: "oklch(1 0 0)"
  packing-green: "oklch(0.525 0.138 147.9)"
  packing-green-on: "oklch(1 0 0)"
  leaf-mist: "oklch(0.951 0.025 152.9)"
  leaf-deep: "oklch(0.419 0.108 148.1)"
  stone-wash: "oklch(0.931 0.005 145.5)"
  muted-wash: "oklch(0.953 0.005 134.9)"
  muted-ink: "oklch(0.423 0.007 153.6)"
  coral-alert: "oklch(0.546 0.177 29.1)"
  amber-wash: "oklch(0.961 0.034 78.7)"
  amber-ink: "oklch(0.479 0.11 58.1)"
  projected-amber: "oklch(0.763 0.141 72.8)"
  hairline: "oklch(0.881 0.007 145.5)"
  focus-green: "oklch(0.618 0.157 147.9)"
typography:
  headline:
    fontFamily: "Baloo 2, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: "2.25rem"
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Baloo 2, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: "1.75rem"
  stat:
    fontFamily: "Baloo 2, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: "2rem"
    fontFeature: "tnum"
  body:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
  lead:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.5rem"
  label:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: "1rem"
rounded:
  sm: "7.2px"
  md: "9.6px"
  lg: "12px"
  xl: "16.8px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.packing-green}"
    textColor: "{colors.packing-green-on}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  button-outline:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  pill-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "32px"
  pill-inactive:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "32px"
  badge-success:
    backgroundColor: "{colors.leaf-mist}"
    textColor: "{colors.leaf-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
    height: "20px"
  badge-warning:
    backgroundColor: "{colors.amber-wash}"
    textColor: "{colors.amber-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
    height: "20px"
  badge-alert:
    textColor: "{colors.coral-alert}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
    height: "20px"
  card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "16px"
  input:
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "4px 10px"
    height: "32px"
---

# Design System: Plan de Packing · Pura Fruit

## Overview

**Creative North Star: "The Packing-Shed Ledger"**

A calm, pale-grey working ground with white rounded cards on it, carrying numbers that plant staff must trust at a glance. The world is the Pura Fruit brand applied to an operations tool: a single field green does the speaking (primary actions, brand mark, highlighted plant names, focus), Baloo 2 gives headings a friendly, rounded warmth, and Nunito keeps body text soft and legible for non-technical staff. Everything else stays quiet so that state color can mean something.

Density is moderate and table-led. Pages are a stack of cards inside a 1280px column; the content inside cards is mostly shadcn tables with right-aligned tabular numerals. Meaning is carried by a strict three-tone state vocabulary (green within plan, amber waiting or changed, coral alarm) that is always paired with an icon or glyph and a text label, never color alone.

The system is built on shadcn/ui (radix-nova style) and Tailwind v4, with every color living in `app/theme.css` as OKLCH light and dark tokens. Dark mode is a first-class peer: the same roles remapped onto a green-tinted near-black, with the logo green (#3DBE5C) brightened for primary.

**Key Characteristics:**
- Pale grey-green ground (#F3F4F2), white cards, hairline rings instead of shadows.
- One brand green for action and emphasis; coral and amber reserved for state.
- Baloo 2 for headings and key figures, Nunito for everything else.
- Tabular, right-aligned numbers in every table and KPI.
- Dark ink pill marks the active view or filter.
- Light and dark themes defined from one token file.

## Colors

A near-neutral green-tinted grey world with one confident field green, plus a colorblind-safe green/amber/coral state set.

### Primary
- **Packing Green** (`packing-green`): primary buttons ("Revisar y aprobar", "Ver planes por aprobar"), the Grape brand mark, the plant name inside page headings, bullet dots in reading lists, the caret, text selection (25% mix), and chart series 1 (executed). Dark mode swaps to logo green oklch(0.709 0.178 147.8).
- **Focus Green** (`focus-green`): focus rings at 50% opacity and the global outline color.

### Secondary
- **Leaf Mist / Leaf Deep** (`leaf-mist`, `leaf-deep`): the success pair ("Aprobado", "Dentro de jornada", "Plan oficial guardado") and the accent pair (section rows in the curso matrix, sidebar accent). Same values, two roles.

### Tertiary
- **Amber Wash / Amber Ink** (`amber-wash`, `amber-ink`): the warning pair: "Pendiente de aprobación", "Requiere horas extra", "Margen bajo", and parameters changed from the plant default.
- **Projected Amber** (`projected-amber`, chart-2): chart series for projected values, the border of changed-parameter chips, and the 2px ring on the "planes por aprobar" card when plans are waiting.
- **Coral Alert** (`coral-alert`, destructive): "Rechazado", "Riesgo de turno extra", below-plan execution cells, negative KPI values, alert text, and the filled pending-count badge on the Planes tab. Destructive buttons and badges use it as text on a 10% coral wash.

### Neutral
- **Ground** (`ground`): page background and outline-button fill.
- **Card White** (`card-white`): cards, popovers, sticky table header cells.
- **Ink** (`ink`): body text and the active-pill fill.
- **Muted Ink** (`muted-ink`): descriptions, summary lines under headings, secondary table text.
- **Stone Wash** (`stone-wash`): secondary fill, used for the active top-nav item.
- **Muted Wash** (`muted-wash`): hover fill for ghost/outline buttons, card footers at 50%.
- **Hairline** (`hairline`): borders, inputs, scrollbar thumb.

### Named Rules
**The Coral Is an Alarm Rule.** Coral appears only where something is wrong or needs a decision now: rejection, extra-shift risk, below-plan numbers, the pending counter. It is never decorative.

**The Amber Means Waiting-or-Changed Rule.** Amber marks something pending a decision or deviating from a default. A changed value shows as an amber chip with "(default X)" beside it.

**The Never Color Alone Rule.** Every state badge carries a Lucide icon and a text label; every below-plan cell carries a down arrow plus screen-reader text. Color reinforces; it never carries meaning by itself.

## Typography

**Display Font:** Baloo 2 (weights 600, 700; via next/font, exposed as `--font-heading`)
**Body Font:** Nunito (via next/font, exposed as `--font-sans`)
**Label/Mono Font:** `ui-monospace, monospace` is mapped but not used on the surfaces.

**Character:** Rounded, friendly heads over a soft humanist body; approachable for plant staff without feeling playful, because the sizes stay modest and the numbers stay tabular.

### Hierarchy
- **Headline** (Baloo 2 700, 1.875rem / 2.25rem, tracking -0.025em): one H1 per page ("Planes semanales", "Curso de la semana 41 · Planta Piura"); `text-balance` on long titles.
- **Title** (Baloo 2 600, 1.25rem / 1.75rem): card titles ("Plan diario", "Tu decisión", "Lectura de la semana"), empty-state titles.
- **Stat** (Baloo 2 700, 1.5rem, tabular): the value in a KPI stat card; turns coral when negative.
- **Lead** (Nunito 400, 1rem / 1.5rem, muted ink): the summary line under an H1, joined with " · ".
- **Body** (Nunito 400, 0.875rem / 1.25rem): card content, table cells, descriptions; reading lists capped at `max-w-prose` (65ch).
- **Label** (Nunito 500, 0.75rem): badges and secondary lines under table row titles.

### Named Rules
**The Tabular Figures Rule.** Every numeric column and KPI uses `tabular-nums` and right alignment, so columns of jabas, workers, and hours line up digit for digit.

**The Heading Face Stays on Headings Rule.** Baloo 2 is for H1s, card titles, stat values, and the wordmark. Body, labels, buttons, and tables stay in Nunito.

## Layout

A single centered column, max 1280px (`max-w-7xl`), with 16px side padding (24px from 640px up) and 24px top/bottom padding (32px from 640px up). Page sections stack with a 24px gap. A sticky 56px header sits on top with a 95% ground fill and backdrop blur, holding the wordmark, role navigation, demo role switcher, and theme toggle. Below 768px the role navigation collapses into a left Sheet behind a menu button.

Inside a page: heading block (H1 plus lead line, 4px gap) then a row of pill filters or view tabs (8px gap, wrapping), then cards. Two-column splits use `lg:grid-cols-[2fr_1fr]` with a 24px gap. Card internal spacing is 16px (12px for small stat cards). Tables scroll horizontally inside their card; wide matrices pin their first column (`sticky left-0`, card-white fill). On narrow screens, list rows fold state badge and action under the row title instead of separate columns.

Known gaps shipped as-is (not rules to copy): at 390px the plans list truncates its Fechas column, and the daily-plan table scrolls horizontally with no scroll cue; demo mode carries no visible "datos de ejemplo" label.

## Elevation & Depth

Flat by default. Cards are separated from the ground by tone (white on #F3F4F2) and a 1px ring of ink at 10% opacity, not by shadow. Emphasis is a thicker colored ring (2px projected amber on a card that needs attention), not a lift. Shadows exist only on true overlays from shadcn: dropdown menus (`shadow-md`) and sheets (`shadow-lg`). The only translucency is the sticky header's blurred 80-95% ground.

### Named Rules
**The Ring, Not Shadow Rule.** Resting surfaces use a 1px foreground/10 ring; attention uses a 2px colored ring. Shadows are reserved for overlays that float above the page.

## Shapes

Generous, friendly rounding driven by one base radius (0.75rem = 12px). Cards round at 16.8px, buttons and inputs at 12px, small buttons at up to 12px, and badges and pills go fully round. Status dots in reading lists are 6px circles in packing green. Empty states use a dashed hairline border. No sharp corners anywhere in the surfaces.

## Components

### Buttons
Compact and soft; one green action per decision point.
- **Shape:** gently rounded (12px), 32px tall (36px `lg`), 10px horizontal padding, 14px Nunito 500, 6px icon gap with 16px Lucide icons.
- **Primary:** packing green fill, white text; hover drops to 80% fill. Reserved for the state-allowed next step ("Revisar y aprobar").
- **Outline:** ground fill, hairline border; hover to muted wash. Used for secondary row actions ("Ver detalle", "Ver curso").
- **Destructive:** coral text on a 10% coral wash, never a solid coral block.
- **Focus / Active:** border turns focus green with a 3px focus-green/50 ring; pressed state nudges down 1px.

### Chips
- **State badges:** 20px tall pills, 12px Nunito 500, a 12px leading icon, tone from the state vocabulary (success wash, warning wash, coral-on-wash, ink-filled for "En ejecución", stone for "Cerrado", outline for "Sin plan oficial").
- **Parameter chips:** outline pills listing plant parameters; a changed value turns amber (amber wash, projected-amber border, amber ink) and appends "(default X)".
- **Pending counter:** solid coral pill with ground-colored digits inside the Planes tab.

### Cards / Containers
- **Corner Style:** 16.8px.
- **Background:** card white.
- **Shadow Strategy:** none; see The Ring, Not Shadow Rule.
- **Border:** 1px ring at ink/10; footers get a top hairline and a 50% muted wash.
- **Internal Padding:** 16px (12px for stat cards).

### Inputs / Fields
- **Style:** 32px tall (textarea min 64px, auto-growing), transparent fill, hairline border, 12px radius, 16px text on mobile and 14px from 768px.
- **Focus:** border to focus green plus a 3px focus-green/50 ring.
- **Error / Disabled:** coral border with 20% coral ring on `aria-invalid`; disabled drops to 50% opacity on an input-tinted fill.

### Navigation
- **Top role nav:** ghost buttons; the current route takes the stone-wash secondary fill and `aria-current="page"`.
- **View tabs and filters (Pill Link):** outline pills, 16px side padding, fully round. The active one fills with ink and ground-colored text (the dark pill); counts sit inside at 70% opacity. Tabs use `aria-current="page"`, filters `aria-current="true"`.

### Projected vs Executed Matrix (signature)
An indicator-by-day table inside a card: sticky first column, accent (leaf-mist) section rows with leaf-deep semibold labels, right-aligned tabular cells, and a "Semana" total column. A cell executed below plan turns coral semibold with a 14px leading down arrow and screen-reader text "Bajo lo proyectado". The legend sits in the card description.

### Stat Card
A small card with the label as description and the value in the Stat style; coral when the figure is below target; optional muted hint line beneath.

## Do's and Don'ts

### Do:
- **Do** take every color from the `app/theme.css` tokens via Tailwind utilities (`bg-primary`, `text-warning-foreground`); define new brand values only there, in light and dark.
- **Do** pair every state color with a Lucide icon and a text label, and give below-plan numbers a down arrow plus `sr-only` text.
- **Do** right-align numeric columns with `tabular-nums`.
- **Do** mark the active view or filter with the dark ink pill, and the current top-nav route with the secondary fill.
- **Do** show values changed from a plant default as an amber chip with "(default X)".
- **Do** separate cards from the ground with the white fill and a 1px ink/10 ring.

### Don't:
- **Don't** use coral for anything that is not an alert, rejection, below-plan figure, or pending counter.
- **Don't** add shadows to cards or resting surfaces; shadows belong to dropdowns and sheets.
- **Don't** set body text, buttons, or table cells in Baloo 2.
- **Don't** use a solid coral fill for destructive buttons; use coral text on the 10% wash.
- **Don't** hard-code hex or OKLCH values in components; that breaks the one-file rebrand and dark mode.
