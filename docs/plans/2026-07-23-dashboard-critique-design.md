# Dashboard Critique Improvements

## Goal

Make the dashboard faster and clearer for a phone-first daily finance ritual while preserving the existing calm ledger register and design tokens.

## Design

- Add a fifth bottom-navigation item for `Registrar`, visually distinct as the primary thumb-zone action. Keep the four existing destinations and use `Resumen` instead of `Dashboard`.
- Rework credit-card alerts so `Pago mínimo` and `Saldo total` are explicitly labeled. Add a visible `Revisar cuenta` action while retaining the whole-row navigation target.
- Keep chart visuals for sighted users, but expose the chart's underlying values through an accessible data list that is keyboard and screen-reader discoverable.
- Replace the all-at-once analysis grid with a single selected analysis view. The user can switch between composition, category spending, daily trend, monthly comparison, and income categories without receiving five competing charts at once.
- Reduce card repetition by rendering the monthly summary and analysis selector as grouped surfaces with dividers rather than independent card shells. Preserve cards for primary status, alerts, and supporting decision metrics.

## Constraints

- Preserve Spanish copy and COP formatting.
- Preserve existing loading, error, stale-data, focus, and reduced-motion behavior.
- Keep all interactive targets at least 44px on mobile.
- Do not introduce new dependencies or a second visual language.

## Success Criteria

- Transaction entry is reachable from the fixed bottom navigation without scrolling.
- Payment alert amounts cannot be mistaken for one another and expose an explicit next action.
- Every chart has an equivalent non-visual data representation.
- Only one analysis module is expanded at a time.
- The dashboard has fewer independent card boundaries while retaining clear grouping.
