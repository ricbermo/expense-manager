# Transactions Fast Entry Design

## Goal

Make the routine act of recording an expense a compact phone-first interaction, while retaining the existing accounting paths for income, transfers, credit-card installments, debt payments, and shared expenses.

## Product Contract

Transactions is a personal ledger view: it must report financial movement plainly and let the owner record the common case quickly. The design uses the existing slate-and-navy system and treats semantic color as supporting financial meaning, never as decoration.

## Entry Flow

### Default state

Opening **Nuevo** starts on **Gasto**. The compact first view contains:

1. Transaction type choices: Gasto, Ingreso, Transferencia.
2. Amount, with numeric keypad semantics and formatted COP value.
3. Origin/payment account.
4. Date, prefilled to today.
5. A primary submit action labelled **Guardar gasto**.
6. A secondary, full-width **Más detalles** disclosure.

The initial expense path must not require reading or skipping optional controls. Income and transfer retain their existing account-validation behavior; transfer exposes a visible destination account but keeps the current optional-destination rule and never inherits the expense’s negative presentation.

### Expanded details

**Más detalles** expands in the same dialog without losing form state. It reveals only fields relevant to the chosen transaction type:

- Expense: Presupuesto, descripción, etiquetas, gasto ocasional, payment of debt, installments for a credit-card purchase, and shared expense.
- Income: category, description, and tags.
- Transfer: destination account, description, and tags.

Debt payment and shared expense stay mutually exclusive. Their existing account-validation and transaction-writing behavior must remain unchanged. The expanded section is open automatically when editing an existing transaction that uses an advanced option, so no data is visually concealed.

### Form feedback

The submit button explains why it is unavailable by showing an inline requirement summary only after the user has attempted to submit or left a required field incomplete. Mutation outcomes use concise Spanish feedback. Technical backend errors never render raw on the page.

## Review Flow

### Transaction rows

Rows keep their date grouping, description, account context, and tabular COP amounts. Expenses remain negative and rose-accented; incomes remain positive and emerald-accented. Transfers become neutral: no negative sign and a source-to-destination meta line.

The recurring/occasional setting is review metadata, not a tiny inline checkbox. The row either displays its occasional status or offers editing through the existing edit action.

### Filters

Search remains visible. All non-search filters move into one named **Filtrar por** surface. It can contain type, recurrence, account, amount range, and the existing budget URL filter. Active criteria are represented completely, and one **Limpiar todo** action resets every local and URL-driven filter.

The filter control is at least 44px high on mobile. It uses labels rather than two separate, horizontally scrolling chip groups that each begin with “Todos.”

## Accessibility and Copy

- All controls that trigger actions have accessible names; the search-clear control is **Limpiar búsqueda**.
- Mobile tap targets for filter, type, and row actions are at least 44 by 44px.
- Date groups are semantic headings.
- Labels use Spanish with correct accents: **Descripción**, **Categoría**, **Presupuesto**.
- Status and monetary semantics never rely on color alone.
- The existing focus-ring, reduced-motion, and Base UI portal conventions remain in use.

## Error and Destructive Actions

Loading retains skeleton rows. Failed loads and failed mutations use actionable Spanish messages with a retry path when meaningful. Delete and pending-discard operations acknowledge completion and preserve the existing inline confirmation behavior unless an undo model can be implemented without weakening data integrity.

## Boundaries

This change does not alter transaction database schema, API routes, account/budget calculation logic, or account destination rules. It reorganizes the existing client UI and adds focused presentation/utilities tests where logic is extracted.

## Verification

- Existing transaction destination and list-meta tests continue to pass.
- New tests cover transfer list presentation and complete filter-reset state where utilities are introduced.
- Biome and a production Next build pass.
- Manual checks cover new expense, income, transfer, debt payment, shared expense, installments, edit of advanced transaction, empty state, error state, and narrow mobile layout.
