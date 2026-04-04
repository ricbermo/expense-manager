BEGIN;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS budget_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'transactions_budget_id_fkey'
  ) THEN
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_budget_id_fkey
      FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE SET NULL;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_transactions_budget ON transactions(budget_id);

-- Backfill only when there is a single unambiguous budget
-- for (user, month, category).
WITH matched AS (
  SELECT
    t.id AS transaction_id,
    ARRAY_AGG(b.id ORDER BY b.id) AS budget_ids,
    COUNT(*) AS budget_count
  FROM transactions t
  JOIN budgets b
    ON b.user_id = t.user_id
   AND b.category_id = t.category_id
   AND b.month = date_trunc('month', t.date)::date
  WHERE t.type = 'expense'
    AND t.category_id IS NOT NULL
    AND t.budget_id IS NULL
  GROUP BY t.id
)
UPDATE transactions t
SET budget_id = m.budget_ids[1]
FROM matched m
WHERE t.id = m.transaction_id
  AND m.budget_count = 1;

CREATE OR REPLACE FUNCTION ensure_transaction_user_ownership()
RETURNS TRIGGER AS $$
DECLARE
  source_owner UUID;
  destination_owner UUID;
  category_owner UUID;
  budget_owner UUID;
  budget_category UUID;
BEGIN
  SELECT user_id INTO source_owner
  FROM accounts
  WHERE id = NEW.account_id;

  IF source_owner IS NULL THEN
    RAISE EXCEPTION 'Origin account not found';
  END IF;

  IF source_owner <> NEW.user_id THEN
    RAISE EXCEPTION 'Origin account belongs to another user';
  END IF;

  IF NEW.to_account_id IS NOT NULL THEN
    SELECT user_id INTO destination_owner
    FROM accounts
    WHERE id = NEW.to_account_id;

    IF destination_owner IS NULL THEN
      RAISE EXCEPTION 'Destination account not found';
    END IF;

    IF destination_owner <> NEW.user_id THEN
      RAISE EXCEPTION 'Destination account belongs to another user';
    END IF;
  END IF;

  IF NEW.category_id IS NOT NULL THEN
    SELECT user_id INTO category_owner
    FROM categories
    WHERE id = NEW.category_id;

    IF category_owner IS NULL THEN
      RAISE EXCEPTION 'Category not found';
    END IF;

    IF category_owner <> NEW.user_id THEN
      RAISE EXCEPTION 'Category belongs to another user';
    END IF;
  END IF;

  IF NEW.budget_id IS NOT NULL THEN
    SELECT user_id, category_id INTO budget_owner, budget_category
    FROM budgets
    WHERE id = NEW.budget_id;

    IF budget_owner IS NULL THEN
      RAISE EXCEPTION 'Budget not found';
    END IF;

    IF budget_owner <> NEW.user_id THEN
      RAISE EXCEPTION 'Budget belongs to another user';
    END IF;

    IF NEW.type <> 'expense' THEN
      RAISE EXCEPTION 'Budget can only be used for expense transactions';
    END IF;

    IF NEW.category_id IS DISTINCT FROM budget_category THEN
      RAISE EXCEPTION 'Budget category does not match transaction category';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
