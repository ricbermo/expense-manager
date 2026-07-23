# Dashboard Critique Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the dashboard faster and clearer on mobile while improving payment clarity, chart accessibility, analysis focus, and ledger-like grouping.

**Architecture:** Keep the existing dashboard data hooks and visual components. Add a five-item bottom-nav action, extract reusable accessible data-list markup for charts, manage one selected analysis view in `src/app/page.tsx`, and replace only unnecessary card shells with divider-based surfaces. Preserve current routes, loading states, and tokens.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Recharts, Lucide icons, Biome.

---

### Task 1: Add the persistent transaction action

**Files:**
- Modify: `src/components/layout/bottom-nav.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Write the failing test**

No test runner is currently configured. Add a small structural test only if the repository's existing test setup is introduced before implementation; otherwise verify through TypeScript, lint, and the mobile route behavior described below.

**Step 2: Implement the minimal navigation change**

- Add a fifth nav item linking to `/transactions?new=1` with a `Plus` icon and label `Registrar`.
- Keep destination labels `Resumen`, `Movimientos`, `Cuentas`, and `Presupuesto`.
- Give the action a distinct primary treatment while keeping a minimum 44px touch target.
- Remove the dashboard header's redundant mobile-only `Registrar` wording only if it becomes duplicated; preserve desktop discoverability.

**Step 3: Verify**

Run: `npm run lint`

Expected: Biome passes with no new diagnostics.

Run: `npm run build`

Expected: Next build completes successfully.

### Task 2: Clarify credit-card alert actions

**Files:**
- Modify: `src/app/page.tsx:243-276`

**Step 1: Implement the alert hierarchy**

- Keep the alert row as a single button routed to `/accounts`.
- Present the amount labels explicitly: `Pago mínimo` and `Saldo total`.
- Keep due-date status text and semantic color, but do not rely on color to communicate urgency.
- Add a visible action cue such as `Revisar cuenta` beside the chevron.
- Preserve truncation and narrow-screen wrapping behavior.

**Step 2: Verify**

Run: `npm run lint`

Expected: no accessibility or formatting diagnostics.

### Task 3: Add accessible chart data views

**Files:**
- Create: `src/components/dashboard/chart-data-list.tsx`
- Modify: `src/components/dashboard/monthly-trend.tsx`
- Modify: `src/components/dashboard/monthly-comparison.tsx`
- Modify: `src/components/dashboard/spending-by-category.tsx`
- Modify: `src/components/dashboard/income-by-category.tsx`

**Step 1: Implement a reusable data-list component**

- Accept rows containing a stable label and formatted value.
- Render a semantic list with a visible heading or visually hidden label.
- Keep the visual chart marked `aria-hidden` and expose the list as the non-visual equivalent.
- Use the same Spanish labels and COP formatting already used by tooltips and legends.

**Step 2: Add rows to each chart**

- Monthly trend: expose each date and cumulative amount.
- Monthly comparison: expose each month with income and expense values.
- Category charts: expose every displayed category, including `Otros`.
- Do not duplicate the chart's aggregate `role="img"` label as the only accessible content.

**Step 3: Verify**

Run: `npm run lint`

Expected: no TypeScript, JSX, or accessibility-related lint issues.

Run: `npm run build`

Expected: build succeeds with all chart data types inferred correctly.

### Task 4: Make analysis single-view and reduce card repetition

**Files:**
- Modify: `src/app/page.tsx:433-535`
- Modify: `src/app/globals.css:149-163`
- Modify: `src/components/dashboard/savings-rate-card.tsx`
- Modify: `src/components/dashboard/expense-projection-card.tsx`

**Step 1: Define the analysis view model**

- Add a union for `composition`, `spending`, `trend`, `comparison`, and `income`.
- Store one selected view in state, defaulting to the first available analysis view.
- Build the available-view list from the same data conditions already used by the dashboard.

**Step 2: Replace the expanded chart grid**

- Keep the `Análisis` disclosure.
- Inside it, render a compact selector with labeled buttons or tabs.
- Render only the selected chart/module at a time.
- Ensure the selector has `aria-selected`, keyboard focus, and a clear selected state.
- Rename the disclosure to communicate its value, such as `Ver tendencias y categorías`.

**Step 3: Reduce unnecessary shells**

- Convert the monthly summary container into a divider-based grouped surface without the full card shadow.
- Keep status, alerts, savings rate, and projection as cards because they represent distinct decisions.
- Keep chart containers grouped under the analysis surface instead of nesting multiple card shells.
- Add projection caveat copy that irregular expenses can affect the estimate.

**Step 4: Verify**

Run: `npm run lint`

Expected: no diagnostics.

Run: `npm run build`

Expected: successful production build.

### Task 5: Preserve historical-month context and transaction links

**Files:**
- Modify: `src/app/page.tsx:343-418`

**Step 1: Preserve the selected month in summary links**

- Route income and expense rows to `/transactions?month=${month}`.
- Keep balance routed to `/accounts`.

**Step 2: Improve historical context**

- Add a visible month label near the dashboard summary or net status when browsing a non-current month.
- Keep the existing month pager and `Este mes` action.

**Step 3: Verify**

Run: `npm run lint && npm run build`

Expected: lint and production build both pass.

### Task 6: Final verification and review

**Files:**
- Verify all modified files.

**Step 1: Run static verification**

Run: `npm run lint`

Expected: pass.

Run: `npm run build`

Expected: pass.

**Step 2: Inspect responsive behavior**

- Verify the five-item nav at phone width and desktop width.
- Verify alert text does not overflow at narrow width.
- Verify chart lists are keyboard reachable and analysis selector changes one module at a time.

**Step 3: Review the diff**

Run: `git diff --check`

Expected: no whitespace errors.

Run: `git status --short`

Expected: only intended dashboard implementation files are modified.
