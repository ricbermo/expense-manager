-- Reclassify legacy credit-card payment rows from `expense` to `transfer`.
--
-- Background: the CC payment flow originally inserted transactions with
-- type='expense' and to_account_id pointing at the credit-card account.
-- Because individual purchases on the card were already registered as expenses
-- against the credit-card account, the payment row produced double-counting in
-- monthly expense totals.
--
-- Loan payments (e.g., mortgage) are intentionally NOT reclassified: loan
-- accounts have no underlying purchase rows, so their cuota is the only
-- representation of cash-flow expense and must stay as type='expense'.

UPDATE transactions
SET type = 'transfer',
    category_id = NULL,
    budget_id = NULL
WHERE type = 'expense'
  AND to_account_id IN (
    SELECT id FROM accounts WHERE type = 'credit_card'
  );
