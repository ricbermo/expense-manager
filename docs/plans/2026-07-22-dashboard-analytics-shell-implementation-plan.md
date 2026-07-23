# Dashboard Analytics Shell Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the dashboard's analytical hierarchy, responsive shell, accessibility states, and financial metric explanations without changing data contracts or business rules.

**Architecture:** Reuse the existing dashboard hook, transaction route, shared layout primitives, and CSS tokens. Update the root shell for viewport/accessibility behavior, adapt the shared navigation by breakpoint, then refine dashboard composition and dashboard-specific explanatory/accessibility content. Keep the analytical section available and use responsive grid structure instead of hiding functionality.

**Tech Stack:** Next.js 16.2.2, React 19, Tailwind CSS 4, TypeScript, lucide-react, Recharts, Biome.

---

### Task 1: Verify Next.js viewport and shell conventions

**Files:**
- Read: `src/app/layout.tsx`
- Read: `node_modules/next/dist/docs/` if present

**Step 1:** Confirm the installed Next.js guidance for the `Viewport` export, `viewportFit`, and mobile viewport behavior.

**Step 2:** Confirm the existing app-shell and navigation stacking contexts in `src/app/globals.css` and `src/components/layout/bottom-nav.tsx`.

**Step 3:** Record the supported approach in the implementation changes; do not introduce a custom meta tag if the Next.js `Viewport` export supports the needed fields.

### Task 2: Restore zoom and make the root shell navigation-safe

**Files:**
- Modify: `src/app/layout.tsx:24-30, 39-43`
- Modify: `src/app/globals.css:137-160`

**Step 1:** Remove `maximumScale` and `userScalable: false` from the viewport configuration.

**Step 2:** Add safe-area-aware shell spacing only where it protects fixed navigation and does not double existing page padding.

**Step 3:** Ensure the main content has responsive clearance for the desktop navigation treatment.

**Step 4:** Run `npm run lint` and expect no new errors.

### Task 3: Adapt shared navigation across breakpoints

**Files:**
- Modify: `src/components/layout/bottom-nav.tsx:27-60`

**Step 1:** Keep the current fixed bottom presentation for mobile.

**Step 2:** Add a medium/desktop presentation that places the same four labeled routes in a compact fixed top navigation.

**Step 3:** Preserve `aria-current`, visible focus, labels, active state, and touch-safe hit areas.

**Step 4:** Verify no route is hidden at either breakpoint and no content is covered by the fixed element.

### Task 4: Add dashboard capture and stronger page hierarchy

**Files:**
- Modify: `src/app/page.tsx:83-120, 121-461`

**Step 1:** Add a specific `Registrar movimiento` action to the page header, linking to `/transactions?month=${month}` and reusing the existing route flow.

**Step 2:** Add a semantic status region for initial load and background refresh, retaining readable previous data during revalidation.

**Step 3:** Keep the existing analytical modules but introduce a responsive analysis grid on medium/large screens.

**Step 4:** Strengthen alert row affordances with explicit destination text or a directional icon while keeping the existing routes.

**Step 5:** Ensure section headings and labels remain consistent with the product vocabulary.

### Task 5: Explain derived financial metrics

**Files:**
- Modify: `src/components/dashboard/expense-projection-card.tsx:55-125`
- Modify: `src/components/dashboard/savings-rate-card.tsx:46-78`

**Step 1:** Rewrite supporting copy so projection basis and savings-rate meaning are understandable without documentation.

**Step 2:** Preserve the existing formulas and thresholds.

**Step 3:** Ensure sparse-data and closed/future month states explain why a value is unavailable.

### Task 6: Preserve all category and chart information accessibly

**Files:**
- Modify: `src/components/dashboard/spending-by-category.tsx:26-65`
- Modify: `src/components/dashboard/monthly-trend.tsx:47-95`

**Step 1:** Aggregate categories beyond the first five into a labeled `Otros` row.

**Step 2:** Expand the chart accessible summary with total and date context while leaving decorative chart markup hidden from duplicate announcements.

**Step 3:** Check labels and overflow behavior for long category/account names.

### Task 7: Final quality pass and verification

**Files:**
- Modify any touched files required by verification only.

**Step 1:** Run `npm run lint`.

**Step 2:** Run `npm run build`.

**Step 3:** Run `node /Users/ricbermo/development/expense-manager/.agents/skills/impeccable/scripts/detect.mjs --json src/app/page.tsx src/app/layout.tsx src/components/layout/bottom-nav.tsx`.

**Step 4:** Inspect the implementation at 375px, 768px, 1024px, and 1440px if browser tooling is available; otherwise use source and build evidence and report the limitation.

**Step 5:** Review the final diff for scope creep, hardcoded colors, duplicate components, and accidental data/business-rule changes.
