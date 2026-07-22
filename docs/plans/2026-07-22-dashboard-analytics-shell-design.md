# Dashboard Analytics Shell Design

## Context

The dashboard already has the right product register: a calm personal ledger with COP values, direct alerts, and restrained semantic color. The approved iteration keeps its analytical depth while improving hierarchy, desktop adaptation, accessibility, and explanatory copy.

## Decisions

- Preserve existing data hooks, queries, routes, and transaction form contracts.
- Add a dashboard capture action that links to `/transactions?month=<selected-month>` and reuses the existing fast-entry flow.
- Keep the mobile bottom navigation. On medium and larger viewports, present the same four routes as a fixed horizontal navigation near the top of the viewport.
- Restore browser zoom and account for safe-area insets in the app shell/navigation.
- Keep the dashboard's analysis section, but give the upper screen a stronger order: month context, net position, attention items, financial summary, derived metrics, composition, then expandable analysis.
- Preserve all existing semantic color meanings and use text/icons alongside color.
- Announce initial loading and background refresh with semantic status attributes/live text, while keeping existing data readable during revalidation.
- Explain projection and savings-rate bases in concise supporting copy.
- Add an `Otros` row to the category breakdown so data is not silently omitted.
- Improve chart accessible labels with the available aggregate values without replacing the visual charts.

## Scope

Primary files:

- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/layout/bottom-nav.tsx`
- `src/components/dashboard/expense-projection-card.tsx`
- `src/components/dashboard/savings-rate-card.tsx`
- `src/components/dashboard/spending-by-category.tsx`
- `src/components/dashboard/monthly-trend.tsx`

Potentially touched only if needed for consistency:

- `src/components/layout/page-header.tsx`
- `src/components/layout/month-pager.tsx`

Non-goals:

- No database schema or business-rule changes.
- No duplicate transaction form or new modal flow.
- No new theme switch or new brand palette.

## Responsive Behavior

- Mobile remains one-column with bottom navigation and large touch targets.
- Tablet and desktop use the same information architecture with a two-column analysis grid where chart width allows it.
- Desktop navigation is top-positioned and compact; mobile navigation remains bottom-positioned.
- Content retains a max width and gains top/bottom clearance for fixed navigation.

## Accessibility and Resilience

- `aria-busy` and a polite live status cover initial load and revalidation.
- All dynamic states retain a visible text equivalent.
- Browser zoom remains available.
- Focus rings and 44px interaction areas are preserved.
- Long account/category names remain shrinkable and truncatable where rows require one line.
- Empty/error states retain a next action or retry path.

## Success Criteria

- The dashboard's most important state is understandable within two seconds.
- The analytical sections remain available without making the first glance noisy.
- The capture action reuses the current Movimientos workflow.
- No horizontal overflow at 375px, and desktop has an efficient navigation treatment.
- Dynamic loading and chart information are accessible without depending on color.
- `npm run lint`, `npm run build`, and the Impeccable detector pass.
