# Accounts Reconciliation Design

## Goal

Make Accounts a trustworthy reconciliation surface: card payments remain auditable and accurate across installments, upcoming obligations lead the view, and account management no longer competes with payment work.

## Decision

Use a statement-payments ledger. Each transfer that pays a card statement receives a dedicated row linked to both the statement and transaction. The statement remains open until the ledger's cumulative amount covers its original total. A database RPC creates the transfer and ledger record atomically, preventing a transfer from succeeding while the statement state fails to update.

## Presentation

- The first Accounts signal is the nearest open payment due, including amount outstanding, due date, and time remaining.
- Liquid funds, card debt, and net position appear as independently labeled secondary values.
- Credit cards sort ahead of non-actionable accounts when they have an open statement; open statements order by nearest due date.
- A card exposes one primary action: pay the nearest statement when one is open, otherwise register a statement. Account editing and deletion move to an overflow action.
- Cards summarize all open statements rather than hiding older debt.

## Validation And Recovery

- Statement values must be positive; the minimum payment cannot exceed the statement total; the due date cannot precede the statement date.
- A payment must be positive, cannot exceed the outstanding amount of its selected statement, and cannot exceed the selected source-account balance.
- Inline error text is announced accessibly and the form remains open with entered values after a rejected request.
- Confirmation copy names the remaining statement balance after a partial payment.

## Tests

Pure presentation and validation helpers receive Node test coverage before implementation. Tests cover cumulative payment totals, paid/open status, due-first ordering, duplicate transaction rejection, and the input constraints above. Database atomicity is enforced in the migration RPC and verified by build/type checks; the client calls only that RPC.
