-- Ensure liability accounts are stored as negative balances.
-- Idempotent: running this multiple times keeps data consistent.

BEGIN;

UPDATE accounts
SET balance = -ABS(balance)
WHERE type IN ('credit_card', 'loan')
  AND balance > 0;

COMMIT;
