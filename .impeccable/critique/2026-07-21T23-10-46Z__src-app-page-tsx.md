---
target: src/app/page.tsx
total_score: 27
p0_count: 1
p1_count: 2
timestamp: 2026-07-21T23-10-46Z
slug: src-app-page-tsx
---
# Critique — `src/app/page.tsx` (Dashboard)

**Method: dual-agent (A: design review · B: detector + browser evidence)**
**Target resolved:** `/Users/ricbermo/development/expense-manager/src/app/page.tsx`
**Slug:** `src-app-page-tsx`

---

## Anti-Patterns Verdict

**Does this look AI-generated?** Not at a glance — but it doesn't escape the template lane either. A competent, restrained calm-fintech dashboard with no garnish, no gradients, no glass abuse. The tells are subtle and structural, not decorative.

**Category-reflex check (two altitudes):**
- **First-order: FAILS.** "Personal finance dashboard" alone predicts slate-navy + emerald/rose + card-driven + big net number + spending donut — which is exactly what ships. The category reflex is matched, not dodged.
- **Second-order: FAILS.** "Calm ledger, not bank-app, not gamified" has its own saturated reflex lane (IBM Plex Sans + muted slate + restrained chrome + uppercase KPI labels), and this lands inside it. The aesthetic family is guessable one tier deeper.

**LLM assessment — absolute bans:**
- Side-stripe borders: **PASS** — alert rows use full borders via `section-card` + `hover:border-primary/30` (`page.tsx:200`, `235`).
- Gradient text: **PASS** — only gradient is the area-chart fill in `monthly-trend.tsx:49-52`, not text.
- Glassmorphism as default: **PASS** — only the bottom-nav uses `bg-card/95 backdrop-blur`, which DESIGN.md explicitly allows.
- Hero-metric template: **BORDERLINE PASS** — "Neto del mes" is big number + small uppercase label + delta pill + "vs mes anterior" (`page.tsx:138-170`), the template shape. Passes only because the hero number IS the product's primary orient signal; the delta pill is the "supporting stat" tic.
- Identical card grids: **BORDERLINE FAIL** — two identical 2-up KPI grids (`page.tsx:274-322`, `324-334`) plus four identical chart section-cards (`page.tsx:440-448`).
- Tiny uppercase tracked eyebrow above every section: **BORDERLINE FAIL** — 6 instances of `text-xs font-medium uppercase tracking-wider text-muted-foreground` on one view (`page.tsx:139`, `280`, `303`, `343`; `savings-rate-card.tsx:47`; `expense-projection-card.tsx:29`/`67`). Framed as the prescribed Label tier, but density crosses into the eyebrow reflex.
- Numbered section markers: **PASS** — none.
- Text overflow at narrow breakpoints: **FAIL** — KPI numbers at `text-2xl tabular-nums` in `grid-cols-2` (~150px per card on 360px) have no `truncate`/`whitespace-nowrap` guard; COP values like `$ 12.345.678` overflow. Budget-alert right column renders `{formatCOP(spent)} / {formatCOP(limit)}` on one `text-xs` line (`page.tsx:264`) — will wrap.

**Deterministic scan:**
- Primary scan on `src/app/page.tsx`: **CLEAN — 0 findings** (exit 0).
- Supplementary scan on `src/components/dashboard/`: **1 advisory** — `design-system-font-size` at `monthly-comparison.tsx:55` (`fontSize: 11px` is off the DESIGN.md type ramp; `ignoreValue: "11px"`).
- The detector did NOT catch the contrast failures Assessment A flagged (amber-600/orange-500/emerald-600 at small text sizes). The detector's rule set does not statically check semantic-color-on-card contrast across arbitrary Tailwind class combinations — this is the LLM catching what the deterministic scan missed. Flagged for the user.

**Visual overlays:** No reliable user-visible overlay is available. No dev server was running on `localhost:3000` and no Playwright/Puppeteer is exposed in this harness, so browser injection was skipped per the critique reference. **Fallback signal: deterministic CLI scan only.**

---

## Overall Impression

A genuinely disciplined calm-ledger dashboard — honest-signal copy, real a11y touches in the right places (`aria-live` month label, expanded hit areas, global reduced-motion), teaching empty states. But it sits squarely inside the calm-fintech template lane: 6 uppercase labels, two identical 2-up grids, four always-rendered chart cards, and a Neto hero that grazes the hero-metric template. The single biggest opportunity: **collapse the dashboard into one ranked orient surface above the fold and gate the analysis section behind disclosure** — that would deliver the 30-second glance PRODUCT.md promises and break the template reflex at the same time.

---

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Skeletons + `aria-live` month label, but flash-to-skeleton on every pager click loses scroll/context |
| 2 | Match System / Real World | 3 | Plain Spanish, COP, "Vence/Vencida"; "Neto" is accounting-adjacent but clear |
| 3 | User Control and Freedom | 2 | Pager works, but no "jump to current month" after paging away, no back/undo on nav |
| 4 | Consistency and Standards | 2 | Month-pager pattern differs vs Transactions (`.month-toolbar` card vs header action); raw `<button>` cards vs `Button` component; chevron h-4 vs h-5 |
| 5 | Error Prevention | 3 | No destructive actions; no guardrail on paging into future months (shows $0 everything) |
| 6 | Recognition Rather Than Recall | 4 | Familiar icons, visible labels, visible month |
| 7 | Flexibility and Efficiency | 2 | No date picker / month jump / YTD / compare — desktop deep-review must click back through N months |
| 8 | Aesthetic and Minimalist Design | 3 | Restrained, but 6 uppercase eyebrows + repeated 2-up grids + 4 identical chart cards edge into template |
| 9 | Error Recovery | 3 | Clear error + retry, but no error context string |
| 10 | Help and Documentation | 2 | Empty states teach, but no inline help on jargon ("tasa de ahorro", "proyección"), no onboarding for self-host forkers |
| **Total** | | **27/40** | **Acceptable (20–27)** |

---

## What's Working

- **Honest-signal discipline**: delta pills return null on `previous===0` or `pct===0` (`page.tsx:38-40`); alerts only render when actionable; no green checkmarks or streak framing; plain Spanish copy. The brand promise actually shows up in the code.
- **Touch-target + reduced-motion craft**: pager buttons get an invisible 6px hit-area expansion (`before:inset-[-6px]`, `page.tsx:86`, `101`) on top of `size-8`; `globals.css:162-171` forces all transitions to 0.01ms under `prefers-reduced-motion`; `aria-live="polite"` on the month label (`page.tsx:94`). Real a11y attention in the right spots.
- **Teaching empty states everywhere**: every chart has purposeful copy ("Registra gastos para ver el desglose por categoria", `spending-by-category.tsx:18`); top-level error state has icon + message + retry (`page.tsx:122-135`). No spinners.

---

## Priority Issues

### [P0] Semantic-color contrast fails WCAG AA
- **Why it matters**: amber-600 (#f59e0b) alert labels at `text-xs` (`page.tsx:208`) and orange-500 (#f97316) occasional amounts at `text-lg` (`page.tsx:383`) fail both 4.5:1 (body) and 3:1 (large); emerald-600 (#059669) delta pills at `text-xs` (`page.tsx:47`, `156`) fail 4.5:1. This breaks PRODUCT.md's "every body text meets contrast" promise and the calm-ledger trust for low-vision users. The deterministic detector missed this; the LLM review caught it.
- **Fix**: darken text-size uses to amber-700/orange-600/emerald-700, or restrict semantic color to icons and render the associated text in `text-foreground`/`text-muted-foreground` (color carries nothing alone — already the Named-Message Rule).
- **Suggested command**: `/impeccable harden`

### [P1] Raw `<button>` cards lack focus-visible ring
- **Why it matters**: alert rows, KPI cards, and balance row (`page.tsx:198`, `233`, `275`, `298`, `336`) are raw `<button>` with only `transition-colors hover:border-primary/30` — they inherit `outline-ring/50` from base CSS but no explicit focus-visible ring, so keyboard focus indication is inconsistent/invisible across browsers. The `Button` component has `focus-visible:ring-3 ring-ring/50` (`button.tsx:9`); these don't.
- **Fix**: add `focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background` to these buttons, or route them through a `Button` variant that preserves the card layout.
- **Suggested command**: `/impeccable harden`

### [P1] ExpenseProjectionCard returns null for past months → visual hole
- **Why it matters**: `expense-projection-card.tsx:16` early-returns null when `month !== getCurrentMonth()`, so paging to any past month leaves the right cell of `sm:grid-cols-2` (`page.tsx:324`) empty on desktop. Breaks the "review a month in depth" desktop use case PRODUCT.md names as secondary.
- **Fix**: render a static "Gasto real a fin de mes: X" card for past months (actual EOM is known), or collapse the grid to `grid-cols-1` when projection is null, or show the prior-month actuals as the comparison.
- **Suggested command**: `/impeccable layout`

### [P2] Six uppercase tracked labels on one view — eyebrow reflex in a DESIGN.md costume
- **Why it matters**: 6 instances of `uppercase tracking-wider` KPI labels (Neto, Ingresos, Gastos, Balance total, Tasa de ahorro, Proyección) is the saturated AI scaffold DESIGN.md's "Don't" list warns against, even if each individual use is the prescribed Label tier. Density reads as grammar, not voice.
- **Fix**: reserve uppercase Label for the primary trio (Neto + Ingresos/Gastos); demote SavingsRate / ExpenseProjection / Balance total to `text-sm font-medium text-muted-foreground` (no uppercase). Drops count from 6 → 3 and re-establishes the Neto focal point.
- **Suggested command**: `/impeccable typeset`

### [P2] Month-pager vocabulary broken across pages + flash-to-skeleton on pager
- **Why it matters**: Dashboard puts the pager in `PageHeader` action slot with `h-4` chevrons + `min-w-[10rem]` label; Transactions uses a centered `.month-toolbar` card with `h-5` chevrons and no min-width. Two patterns for the same control. Separately, clicking the pager sets `loading=true` and replaces the entire dashboard with skeletons (`page.tsx:112`), losing scroll position and context on every month change — jarring for a daily-ritual app.
- **Fix**: extract one `MonthPager` component (pick the `.month-toolbar` card pattern, it's more legible) and reuse everywhere; switch `useDashboard` to stale-while-revalidate (keep previous data rendered with a subtle opacity/stale cue while refetching) instead of flipping to skeleton.
- **Suggested command**: `/impeccable shape` (component) + `/impeccable animate` (refetch behavior)

---

## Persona Red Flags

**Andrea — daily-check phone user, one-handed on mobile web, 30-sec glance, zero friction tolerance** (derived from PRODUCT.md primary user):
- KPI overflow on 360px: Ingresos/Gastos at `grid-cols-2` → ~150px each; a COP salary like "$ 5.000.000" at `text-2xl tabular-nums` (`page.tsx:289`, `313`) has no `truncate` guard and either compresses or overflows — she reads garbage on the two numbers right under the hero.
- Alert row navigates away: tapping a card-payment alert pushes to `/accounts` (`page.tsx:201`), a full page swap. One-handed, she wanted a glance at the alert, not to leave the dashboard; the bottom-nav is the only way back.
- 4 analysis charts render on every load: she never scrolls to them in a 30-sec check, but they mount and run Recharts on mobile every time — wasted render on a phone opened 5×/day.

**Sam — accessibility-dependent, keyboard + screen reader, low vision**:
- Focus ring gap on raw button cards: alert rows and KPI cards (`page.tsx:198`, `233`, `275`, `298`, `336`) inherit only `outline-ring/50` with no width/style — keyboard focus is inconsistent across browsers; Sam can't tell which card is active.
- Charts `aria-hidden` with no data fallback: all four chart containers are `aria-hidden="true"` (e.g. `monthly-trend.tsx:45`, `monthly-comparison.tsx:38`) with no associated `<title>` or data-table fallback — Sam gets the legend list but loses the trend and 6-month comparison entirely.
- Amber/orange alert text unreadable: "Vence en N días" at `text-xs text-amber-600` (`page.tsx:208`) and "Ocasionales" at `text-lg text-orange-500` (`page.tsx:383`) fail contrast — Sam with low vision can't read the urgency label on the very alerts meant to orient him.

**Alex — power user, desktop deep-review session** (PRODUCT.md secondary use case):
- No month jump: reviewing March from July means 5 chevron clicks — the desktop "review a month in depth" workflow has no date picker or jump-to-month, only prev/next.
- Projection hole on past months: `ExpenseProjectionCard` returns null for any non-current month, leaving a blank cell in the `sm:grid-cols-2` row — Alex reviewing history sees a visual gap where a useful "actual EOM" number could be.
- No compare/YTD: the dashboard is strictly single-month; the desktop deep-review use case wants 2-month compare or YTD context, which is entirely absent.

---

## Minor Observations

- Skeleton shapes (h-32, h-24×2, h-16, `page.tsx:113-120`) don't match loaded content structure — under-represents page height and shifts layout on resolve.
- "Composición de gastos" renders when *either* recurring or occasional > 0 (`page.tsx:358`) but always shows both columns — the muted "$ 0" column is noise when one is zero.
- topGrowthCategory copy "aumentó vs el mes anterior" (`page.tsx:431-435`) doesn't say "gasto" — ambiguous for an income category that also "aumentó".
- `cursor-pointer` on native `<button>` elements (`page.tsx:200`, `235`, `276`, `299`, `337`) is redundant; buttons are pointer-by-default in modern browsers.
- Chart `<ResponsiveContainer>` blocks have no associated `<title>` or `aria-labelledby` — screen readers lose trend/comparison data despite the visible `h3` headings.
- `transition-all` on the composition progress bar (`page.tsx:393`, `399`) animates `width` (a layout property) on month change — against the motion rule, though visually minor at h-2.
- Supplementary detector finding: `monthly-comparison.tsx:55` uses literal `fontSize: 11px` off the DESIGN.md type ramp (advisory only).

---

## Questions to Consider

1. If the dashboard's one job is "orient" in 30 seconds, why are 4 analysis charts always-rendered below the fold instead of behind a "Ver análisis" disclosure — what would be lost by making the analysis section opt-in per session?
2. The Neto hero uses emerald/rose for sign but no icon, no `+`/`-` prefix, no arrow — is color doing semantic work that a single TrendingUp/Down icon (already in the delta pill below) could do more honestly, especially for the ~4.5% of men who can't distinguish those hues?
3. Six uppercase tracked labels on one view, two identical 2-up card grids, four identical chart cards — is this a deliberate "calm ledger" system, or has DESIGN.md's Label tier become the license to scaffold by reflex? What would this dashboard look like if you deleted half the uppercase and merged the two 2-up grids into one ranked list?
