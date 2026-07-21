---
target: src/app/page.tsx
total_score: 27
p0_count: 0
p1_count: 4
timestamp: 2026-07-21T22-32-40Z
slug: src-app-page-tsx
---
# Critique: `src/app/page.tsx` — Dashboard

**Method: dual-agent (A: ses_079342833ffe4m7mI5CSOx6A6H · B: ses_07933f77fffesgeGfmEbv73UOI)**
Assessment A = qualitative design review; Assessment B = deterministic detector (`detect.mjs`) + browser visualization (browser unavailable this session — CLI scan only).

---

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Skeleton loaders ✓; no `aria-live` on month label; no error state if `useDashboard` fails |
| 2 | Match System / Real World | 3 | COP + Spanish ✓; "pts" savings delta mildly jargony |
| 3 | User Control and Freedom | 2 | No "jump to today"; returning from a 6-month-old view = 6 taps back |
| 4 | Consistency and Standards | 3 | Chart cards break `section-card` consistency with extra `ring`; tappable cards lack button affordance |
| 5 | Error Prevention | 3 | Month nav unbounded (1900–2099); no guardrails on future months |
| 6 | Recognition Rather Than Recall | 4 | Icons + labels everywhere; month displayed; contextual sub-text on all metric cards |
| 7 | Flexibility and Efficiency | 3 | 30-sec ritual works; no keyboard shortcuts, no time-range selector on charts |
| 8 | Aesthetic and Minimalist Design | 2 | Warm amber bg gradient violates palette; ring+border+shadow on charts; 8 flat sections; inverted hierarchy |
| 9 | Error Recovery | 2 | No error state for failed load; user sees `$0` everywhere with no explanation |
| 10 | Help and Documentation | 2 | Contextual sub-text helps; no tooltips on "Tasa de ahorro" / "Proyección"; no onboarding for empty state |
| **Total** | | **27/40** | **Acceptable — significant improvements before users are happy** |

---

## Anti-Patterns Verdict

**Does this look AI-generated?** Not as a whole. The composition is disciplined — none of the impeccable absolute bans fire (no side-stripes, no gradient text, no glassmorphism-as-default, no hero-metric template, no identical icon-card grid, no eyebrow-on-every-section, no numbered markers, no text overflow). A fluent Linear/Stripe user would trust the structure. But they would pause at three subtly-off elements in the **decoration layer**:

1. **Warm amber body background gradient** (`globals.css:130-133`) — `rgba(202, 138, 4, 0.08)` radial blob on `body`. DESIGN.md bans warm neutrals explicitly ("never warm, never cream, never sand"); PRODUCT.md lists "SaaS slop" as anti-reference. This is the single most "AI-generated dashboard" tell on the page — the saturated AI bg-gradient reflex, just dialed down. A calm ledger should be flat `#f8fafc`.
2. **Chart cards stack three edge cues** — `<Card className="section-card …">` in all four chart components merges `ring-1 ring-foreground/10` (Card base) with `border border-border/90 + shadow-sm` (section-card). Ring + border + shadow = the One-Cue-Too-Many violation from DESIGN.md §4. Produces a visible double-outline.
3. **Zero values wear semantic colors** — fresh user sees `$0` Gastos in `text-rose-600` and `$0` Ingresos in `text-emerald-600`. Color screaming bad/good at a value that is neither. Named-Message Rule violation in spirit.

**Deterministic scan**: `detect.mjs` ran on 10 targeted files (exit 2, 2 findings) and `src/app` + `src/components` broad scan (exit 2, 6 findings). Breakdown:
- `design-system-font-size` ×4 — `monthly-comparison.tsx:56` (11px Recharts legend), `bottom-nav.tsx:44` (11px nav label), `transactions/page.tsx:232` (10px badge — **true positive, off ramp**), `button.tsx:28` (0.8rem `sm` variant — **true positive, shadcn drift**).
- `design-system-color` ×2 — `apple-icon.tsx:18` and `icon.tsx:18` both use `#10b981` (emerald-500) for the `$` glyph; DESIGN.md documents emerald as `#059669`. Asset generators, not UI surface — but a real minor inconsistency between icon green and UI emerald.

**False positives (2)**: `monthly-comparison.tsx:56` and `bottom-nav.tsx:44` 11px hits — DESIGN.md §3 documents the **Mini** step at `0.6875rem / 11px` with bottom-nav labels as the named canonical use case. Detector is not normalizing rem/px equivalence.

**What the detector did NOT flag (correctly)**: the `text-xs uppercase tracking-wide` metric labels were not flagged as eyebrows (sanctioned Label layer); `Requiere atención` `<h2>` not flagged; semantic colors not flagged as sole-channel (all paired with label/icon); bottom-nav glass not flagged (sanctioned exception); `animate-pulse` skeletons not flagged as decorative motion.

**Visual overlays**: unavailable — no browser automation tool exposed in this session. No dev server started, no scripts injected. CLI scan is the sole deterministic signal; the qualitative review above is the visual proxy.

---

## Overall Impression

The dashboard's skeleton is right: "Neto del mes" owns the top with the right size and tabular-nums, tappable cards give one-tap drill-down, skeletons are correct, the calm-ledger voice holds in copy. But the page has three honest-signal problems stacked on top of each other: (a) the most financially urgent section ("Requiere atención") is buried at position 7 of 8 — a user with an overdue card scrolls past six sections of good news to find it; (b) the derived outlook metrics (savings rate, projection) render at `text-2xl` and visually outrank the primary Ingresos/Gastos pair at `text-xl` — the hierarchy is inverted; (c) the decoration layer (amber bg gradient, triple-cue chart cards, zero-value coloring) whispers "AI-generated dashboard" to a trained eye. The single biggest opportunity: **re-order the page so urgency follows orientation, then fix the hierarchy so primaries stay louder than derivatives.**

---

## What's Working

1. **The "Neto del mes" hero** (`page.tsx:122-150`) — correct implementation of one-screen-one-job. Primary number above the fold, `text-3xl md:text-4xl tabular-nums`, delta pill with icon + value + "vs mes anterior" label, emerald/rose keyed to sign. The page's best element.
2. **Progressive disclosure via tappable cards** — KPIs → `/transactions`, balance → `/accounts`, alerts → `/accounts` or `/budgets`. The dashboard stays orient-only; drill-down is one tap away without the page doing too much.
3. **Loading skeleton matches layout** (`page.tsx:112-119`) — `animate-pulse` on `section-card`-shaped divs, no spinners, no layout shift, and `prefers-reduced-motion` kills the animation in `globals.css:166-175`. Correct.

---

## Priority Issues

### [P1] Warm amber body background gradient
- **Why it matters**: `globals.css:130-133` paints a `rgba(202, 138, 4, 0.08)` amber radial on `body`. DESIGN.md §2 bans warm neutrals ("never warm, never cream, never sand"); PRODUCT.md lists "Generic SaaS slop" as an anti-reference. Amber-on-slate is the saturated AI bg-gradient reflex, just dialed down. A calm ledger should be flat paper.
- **Fix**: Remove the `background-image` block on `body` (`globals.css:130-133`); keep `bg-background` only. If you want depth, a 1px slate-200 → paper vertical gradient is the on-palette move.
- **Suggested command**: `/impeccable quieter`

### [P1] Chart cards stack ring + border + shadow (One-Cue-Too-Many)
- **Why it matters**: All four chart components (`spending-by-category`, `income-by-category`, `monthly-trend`, `monthly-comparison`) wrap content in `<Card className="section-card …">`. The `Card` base contributes `ring-1 ring-foreground/10` (`card.tsx:15`); `section-card` contributes `border border-border/90 + shadow-sm` (`globals.css:150`). Three edge-defining cues stack → visible double-outline. Breaks DESIGN.md §4's most important surface rule.
- **Fix**: Drop `<Card>` in the four chart components and use `<div className="section-card …">` like the rest of the page (consistency + one fewer cue). Or strip the ring from `Card` globally if no other surface needs it.
- **Suggested command**: `/impeccable polish`

### [P1] "Requiere atención" buried at section 7 of 8
- **Why it matters**: Alerts sit after neto, KPIs, savings, projection, balance, composition, and top-growth. A user with an overdue card payment scrolls past six sections of good news to find the urgency. This inverts the honest-signal principle: the most financially urgent information is the least prioritized in page order. The 30-second daily ritual becomes a 30-second scroll when the news is bad.
- **Fix**: Move the alerts section to immediately after the neto hero (position 2 of 8). Bad news seen in the first screenful, before outlook and composition.
- **Suggested command**: `/impeccable layout`

### [P1] Month nav touch targets are 28×28px
- **Why it matters**: `size="icon-sm"` → `size-7` = 1.75rem = 28px (`button.tsx:33-34`). Apple HIG requires 44×44pt; this is a mobile-first PWA. The primary navigation control is hard to tap accurately with the thumb, especially "next month" on the right edge.
- **Fix**: Use `size="icon"` (32px) + an invisible `before:absolute before:inset-[-6px]` hit-area expander, or bump to a 40–44px button. Verify the focus ring still fits.
- **Suggested command**: `/impeccable harden`

### [P2] Inverted hierarchy: outlook louder than flow
- **Why it matters**: Savings Rate and Expense Projection render their values at `text-2xl` (`savings-rate-card.tsx:70`, `expense-projection-card.tsx:90`); Ingresos/Gastos render at `text-xl` (`page.tsx:166,184`). Derived metrics are visually louder than the primary income/expense pair they're derived from. Users parse the page as "savings rate is the headline," which is wrong — the headline is the neto, then its components, then the derived outlook.
- **Fix**: Bump Ingresos/Gastos to `text-2xl` or drop Savings/Projection to `text-xl`. The hierarchy should read: neto (3xl/4xl) → ingresos+gastos (2xl) → outlook (xl) → balance (lg) → composition/alerts (sm).
- **Suggested command**: `/impeccable typeset`

---

## Persona Red Flags

**Alex (Power User)**: No keyboard shortcuts for month nav (arrow keys do nothing). No "jump to today" after navigating away — six taps to return from May to November. `MonthlyComparison` is hardcoded to 6 months; can't zoom out. Charts have no time-range selector. The four chart cards are static images beyond hover tooltips. After a week of daily use, Alex feels the dashboard tells the same story with no way to ask different questions. The "Comparativa mensual" legend is `11px` (`monthly-comparison.tsx:56`) — power-user density is missing on the one place it would help.

**Sam (Accessibility)**: Month nav buttons are 28×28px — below the 44pt minimum. Month label change has no `aria-live` announcement, so screen-reader users don't hear month changes. Pie charts (`spending-by-category.tsx`, `income-by-category.tsx`) are SVG with no `aria-label`, no `<title>`, no text alternative — invisible to screen readers. Only one `<h2>` on the page ("Requiere atención"); the composition section and all four chart sections use styled `<p>` instead of headings, so screen-reader heading navigation skips most content. Recharts tooltips are hover-only (no keyboard focus).

**Bermo (the owner — distracted mobile, 30-sec COP ritual)**: Primary number (neto) lands without scroll ✓. But if there's an overdue card, it's six sections down — the 30-second ritual becomes a 30-second scroll to find the bad news. The body background's amber blob is subconsciously warm on a "calm slate" product — feels slightly off without being able to name why. The KPI cards are tappable but nothing on mobile says so — no chevron, no "Ver detalle"; Bermo taps them by accident trying to scroll. `formatCOP` for a `$5.000.000` balance in `text-lg` inside the balance button (`page.tsx:213`) on a 360px screen risks crowding the arrow icon. Month nav buttons are thumb-missable at 28px.

---

## Minor Observations

- `page.tsx:82` outer `<div className="pb-6">` + `page-stack`'s `pb-28 md:pb-8` (`globals.css:146`) = double bottom padding (8.5rem on mobile). Redundant.
- "Composición de gastos" bar uses `bg-emerald-500` for recurring expenses (`page.tsx:247`) — emerald is reserved for income/positive/savings per DESIGN.md §2; recurring expense is not "good." Use slate/neutral for recurring, keep orange for occasional.
- `page.tsx:95` `min-w-[8.5rem]` (136px) may clip "Septiembre 2026" at `text-sm`; use `min-w-[10rem]` or `whitespace-nowrap`.
- Three copies of `getCurrentMonth()` exist (`page.tsx:28-31`, `savings-rate-card.tsx:17-20`, `expense-projection-card.tsx:13-16`). Tokenize into `lib/utils/dates`.
- Chart card titles are `<p>` not `<h3>` — misses screen-reader heading nav. Pie charts have no `aria-label`/`<title>`.
- `monthly-trend.tsx:45` title says "Gasto acumulado" but empty-state title (`monthly-trend.tsx:23`) says "Tendencia diaria" — inconsistent naming for the same card.
- "Pagos de tarjeta" / "Presupuestos" sub-labels (`page.tsx:302,350`) only render when both alert types exist; when only one type exists, the section has no label — slightly inconsistent.
- `expense-projection-card.tsx:51-54` can show "Promedio 1m previos" when only one prior month exists — that's not an average, it's just last month. Require ≥2 or relabel.
- `transactions/page.tsx:232` 10px filter-count badge — true positive, below the 11px Mini step in DESIGN.md. Enlarge the badge or add a 10px step to the ramp.
- `button.tsx:28` `sm` variant at `0.8rem` (12.8px) — shadcn-default drift, not on the project ramp. Snap to 12px or 14px, or document 0.8rem as a step.
- `apple-icon.tsx:18` and `icon.tsx:18` use `#10b981` (emerald-500) for the `$` glyph; DESIGN.md documents emerald as `#059669`. Minor brand-color inconsistency between iconography and UI semantic emerald.

---

## Questions to Consider

- If the dashboard's job is "orient in 30 seconds," why does "Requiere atención" sit below savings rate, projection, balance, composition, and top-growth? Shouldn't the most actionable, most urgent content be the second thing the user sees, right under the neto?
- The page renders three expense views: "Composición de gastos" (recurring vs occasional bar), "Gastos por categoria" (pie), and "Gasto acumulado" (area chart). Are three views of the same axis redundant for a single-user daily ritual? Could one replace all three?
- Every tappable card uses `hover:border-primary/30` as its only affordance — invisible on touch. If the whole page is a calm ledger of tappable drill-downs, should the affordance be structural (a persistent chevron, a subtle "Ver" label) rather than a hover-only color shift?
- What does a brand-new user see on their first open? `$0` everywhere in semantic colors, no "Agrega tu primera transacción" prompt. Is the empty state the highest-leverage moment to teach the interface, and it's currently absent?
