---
name: Gastos — Expense Tracker
description: Single-user personal finance tool — calm, honest, fast daily ritual.
colors:
  ink: "#020617"
  paper: "#f8fafc"
  navy: "#0f172a"
  navy-mid: "#1e3a8a"
  card-white: "#ffffff"
  slate-100: "#e2e8f0"
  slate-200: "#dbe4ee"
  slate-300: "#dbeafe"
  muted-bg: "#eef2f7"
  muted-text: "#475569"
  blue-light: "#bfdbfe"
  emerald: "#059669"
  rose: "#e11d48"
  amber: "#f59e0b"
  chart-1: "#1e3a8a"
  chart-2: "#0f766e"
  chart-3: "#ca8a04"
  chart-4: "#dc2626"
  chart-5: "#475569"
typography:
  display:
    fontFamily: "\"IBM Plex Sans\", ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.5rem, 4vw, 1.875rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "\"IBM Plex Sans\", ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "\"IBM Plex Sans\", ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.05em"
    textTransform: uppercase
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
  "2xl": "1.125rem"
spacing:
  none: "0px"
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-default:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 0.625rem"
    height: "2rem"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    border: "1px solid {colors.slate-200}"
    height: "2rem"
  card-default:
    backgroundColor: "{colors.card-white}"
    rounded: "{rounded['2xl']}"
    padding: "1rem"
    border: "1px solid {colors.slate-200}"
---

# Design System: Gastos — Expense Tracker

## 1. Overview

**Creative North Star: "The Personal Ledger"**

Every screen reads like a page from a well-kept ledger — no-nonsense, honest, personal. This is not a bank app, a fintech demo, or a gamified budget tool. It is a calm, clear view of where money is, what was spent, and whether the budget is on track.

The system is cool-toned and restrained: slate and navy neutrals, a blue accent used sparingly, and semantic color (emerald for positive, rose for negative, amber for warnings) reserved for moments where the user actually needs to react. Cards use rounded-2xl corners and subtle shadows to sit on the background without calling attention to themselves. Layout is compact and efficient — the information density rewards a 30-second glance while still supporting deeper inspection.

### Key Characteristics

- Cool slate-and-navy palette — never warm, never cream, never sand
- Single font family (IBM Plex Sans) at weights 400 / 500 / 600 — unity, not pairing drama
- Card-driven dashboard: each KPI, chart, and alert is an independent rounded container on a fixed subtle-gradient background
- Bottom-nav glass sheet as the primary navigation (mobile-first, no sidebar)
- Compact controls: h-8 buttons, tight padding, small type — the tool stays out of the way
- Semantic color is informational, not decorative — emerald and rose carry real financial signal
- Dark mode inverts the palette without introducing new hues — the same slate-and-navy values, just reordered

## 2. Colors

**The Slate & Navy Palette.** Cool, crisp, legible. No warm neutrals, no sand, no cream.

### Primary
- **Navy** (#0f172a): The brand anchor. Used for primary button backgrounds, active bottom-nav items, and page header text. On dark mode it becomes the foreground (text).
- **Paper** (#f8fafc): Page background. Cool near-white with a slight blue-slate tilt. On dark mode it inverts to near-black (#020617).

### Accent
- **Slate-300** (#dbeafe): Accent surface. Light blue used for accent backgrounds and highlight containers. On dark mode: deep navy (#172554).
- **Blue-Deep** (#1e3a8a): Accent foreground, ring color, and chart-1. Used as the focus-visible ring on all interactive elements and as the accent text on light backgrounds.

### Neutral
- **Ink** (#020617): Body text, near-black. Must maintain ≥4.5:1 contrast against paper and card-white at all weights.
- **Card-White** (#ffffff): Card, popover, sidebar backgrounds. Crisp white against the cool paper page. Dark mode: #0b1220 (deep navy-card).
- **Slate-100** (#e2e8f0): Secondary surfaces, hover states, light dividers. Dark mode: #1e293b (dark slate).
- **Muted-Bg** (#eef2f7): Extremely subtle hover/preparation surfaces. One step below slate-100 in prominence.
- **Muted-Text** (#475569): Labels, secondary copy, placeholders. At 4.5:1 against paper; checked.
- **Slate-200** (#dbe4ee): Borders and input strokes. Thin visual separation without adding weight.

### Semantic
- **Emerald** (#059669): Income, positive net, savings rate, recurring expenses — green signals that carry financial good news. On dark mode it remains in the green family but shifts slightly (#5eead4) for sufficient contrast on dark surfaces.
- **Rose** (#e11d48): Expenses, negative deltas, urgent card-payment alerts, over-budget. Red means attention. Dark mode: lighter rose (#fca5a5).
- **Amber** (#f59e0b): Warnings — near-due payments, approaching budget limits. Caution, not alarm.
- **Orange** (#f97316): Occasional expenses. A middle ground between emerald (recurring) and rose (urgent).

### The Named-Message Rule

Semantic color always carries a label or icon. Emerald does NOT mean "all green things" — every colored number has text ("Ingresos", "Gastos", "Neto") or an icon. Color is redundant support, not the sole channel.

## 3. Typography

**Single Font:** IBM Plex Sans (300 / 400 / 500 / 600 / 700)

IBM Plex Sans was chosen for its humanist warmth without being friendly. It reads clearly at small sizes on mobile while carrying weight at display sizes. One family eliminates pairing risk.

### Hierarchy
- **Display** (600, clamp(1.5rem, 4vw, 1.875rem), 1.2, –0.025em): Page title (h1). Used once per view.
- **Headline** (500, 1.25rem / 20px): KPI numbers and chart value labels. When used as a number, apply `tabular-nums` for consistent digit widths.
- **Title** (500, 0.875rem / 14px): Month label, card titles, section headers within a page.
- **Body** (400, 0.875rem / 14px, 1.6): All prose content, transaction descriptions, alert messages. Max-width capped at 65–75ch on prose blocks.
- **Label** (500, 0.75rem / 12px, 0.05em, uppercase): KPI category labels, form labels, table column headers. The only uppercase treatment; use sparingly.
- **Mini** (500, 0.6875rem / 11px): Bottom-nav item labels, smallest metadata.

### The No-Pairing Rule

One font, all weights. No serif companion, no display font, no mono for contrast. Hierarchical distinction comes from weight (semibold for numbers and headings), size, and tracking — never from a second family. IBM Plex Sans' own weight range (Light through Bold) provides enough range.

## 4. Elevation

Layered by rounded containers, not by z-depth. The system uses tonal card stacking rather than pronounced drop shadows.

### Principle

The page background (paper) is the base. Cards and containers sit on it via three cues together: 1 px border in slate-200, rounded-2xl corners (1.125rem), and a barely-there shadow (Tailwind shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05)). The combination creates separation without any single cue feeling heavy.

Interactive elements (buttons, KPI cards, bottom-nav items) gain a slightly elevated state on hover by shifting the border toward the primary or by applying a primary background with shadow-sm. No floating, no blur-depth, no multi-layer shadow.

### The One-Cue-Too-Many Rule

Never combine border + shadow + background-tint + gradient on the same container. Pick two, at most three. A card gets border + shadow. A KPI card on hover gets border-tint + background-tint. An alert gets background-tint + border-tint. Adding all four is the AI card trade.

## 5. Components

### Buttons

Compact, quiet, definitive. Sourced from shadcn's base-nova style with @base-ui/react. Default variant uses the navy primary; ghost and outline variants handle secondary and tertiary actions.

- **Shape:** rounded-lg (0.625rem)
- **Default (Navy):** bg-navy text-white. Hover: 80% opacity (same color, lighter feel). Active: translate-y-px press. Focus: ring (blue-deep at 50% opacity).
- **Outline:** 1px border in slate-200, transparent background. Hover: slate-100 background, ink text. Active press. Used for secondary in-page actions.
- **Ghost:** transparent bg at rest. Hover: muted-bg. Used for icon buttons and toolbar controls (month prev/next, dismiss).
- **Destructive:** rose at 10% bg, rose text. Hover: 20% bg. Used for delete actions.
- **Link:** ink text with underline-offset-4, hover underline. Reserved for the single text-action on a page.
- **Sizes:** default h-8 (2rem) px-2.5, icon h-8 w-8. Smaller xs/sm and larger lg variants exist but default is the workhorse.

### Cards / Containers

Every data container is a card. The dashboard has no raw data table — every metric, chart, and alert is wrapped in the same card shell for visual consistency.

- **Shape:** rounded-2xl (1.125rem)
- **Background:** card-white
- **Border:** 1px solid slate-200 at 90% opacity
- **Shadow:** shadow-sm
- **Internal padding:** p-4 (1rem), bumped to p-5 on md+ for standalone KPI cards. Alert cards use tighter p-3 (0.75rem).
- **Interactive cards (KPI, alert items):** cursor-pointer, hover:border shifts to primary at 30% opacity. No other hover effect — border shift is sufficient.

### Input / Fields

- **Shape:** rounded-lg (0.625rem)
- **Background:** transparent or card-white, depending on container
- **Border:** 1px solid slate-200 (full opacity, not the card's 90%)
- **Focus:** blue-deep ring at 50% opacity, border shifts to blue-deep. No glow, no shadow.
- **Error:** border shifts to destructive color (rose), ring at 20% opacity.
- **Disabled:** 50% opacity, pointer-events none.

### Bottom Navigation

The single persistent navigation. Mobile-first by design — always present on phone, decorative on desktop (no sidebar alternative). Sits fixed at bottom, floating above content with a glass sheet effect.

- **Shape:** rounded-2xl container (1.125rem), glass effect via bg-card at 95% opacity + backdrop-blur
- **Layout:** 4-column grid (Dashboard, Transactions, Accounts, Budgets)
- **Item shape:** rounded-xl (0.875rem) within the nav
- **Default state:** muted-text label, no bg
- **Active state:** navy bg, white icon + label, shadow-sm
- **Hover state (inactive):** muted-bg background, ink text
- **Label style:** mini (11px), medium weight

### Page Header

- **Layout:** app-shell wrapper, pb-3 pt-6, flex with content on left and optional action on right
- **Title:** Display hierarchy (semibold, 1.5rem / 1.875rem clamp)
- **Description:** body-size muted-text, optional, appears below title
- **Action slot:** right-aligned, typically a button

## 6. Do's and Don'ts

### Do
- Do use slate-and-navy cool neutrals. The background is paper (#f8fafc), not cream, sand, or warm beige.
- Do make body text reach ≥4.5:1 against its background. Ink on paper passes; ink on any tinted surface requires checking.
- Do use semantic color (emerald / rose / amber / orange) only for financial signals that carry meaning, not for decoration.
- Do accompany every colored value with a text or icon label — color is redundant reinforcement, never the sole channel.
- Do use tabular-nums on all monetary amounts so digits don't shift width as values change.
- Do cap the page at max-w-5xl (64rem). Content should not stretch across wide monitors.
- Do apply `text-wrap: balance` on h1 headings for even line lengths.
- Do honor `prefers-reduced-motion: reduce` on every animation, even hover transitions (0.01ms fallback is in globals.css).

### Don't
- **Don't** use a warm-tinted background (cream, sand, beige, bone, parchment, linen, ivory, biscuit). The project explicitly rejects the AI-default warm neutral.
- **Don't** create hero-metric layouts with a giant number, small label, supporting stats, and gradient accent. The dashboard's KPI grid is compact — 4 columns on lg, 2 on sm, 1 on xs — each card is the same size with no single stat elevated above others.
- **Don't** put tiny uppercase tracking-heavy eyebrows ("INGRESOS" in 10px / 0.1em) above every section. The KPI labels already use uppercase at 12px with 0.05em tracking — one layer, not every section.
- **Don't** apply side-stripe borders (border-left greater than 1px as a colored accent on cards or list items). Full borders or nothing.
- **Don't** use gradient text (background-clip: text). Single solid color only; emphasis via weight or size.
- **Don't** use glassmorphism as a default surface treatment. The bottom nav's glass is the one exception and is purpose-built (fixed overlay, needs to let content show through).
- **Don't** nest cards. One card, one container.
- **Don't** ship animated layouts (animating width/height/top/left). Use transform and opacity only.
- **Don't** create alarm fatigue with multiple simultaneous toasts. One toast at a time; non-urgent alerts go into the page content, not as overlays.
- **Don't** hardcode the author's name or personal data into UI strings. The project targets open-source forkers — token everything.
