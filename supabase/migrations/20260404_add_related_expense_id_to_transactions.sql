BEGIN;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS related_expense_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'transactions_related_expense_id_fkey'
  ) THEN
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_related_expense_id_fkey
      FOREIGN KEY (related_expense_id) REFERENCES transactions(id) ON DELETE SET NULL;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_transactions_related_expense ON transactions(related_expense_id);

CREATE OR REPLACE FUNCTION ensure_transaction_user_ownership()
RETURNS TRIGGER AS $$
DECLARE
  source_owner UUID;
  destination_owner UUID;
  category_owner UUID;
  budget_owner UUID;
  budget_category UUID;
  related_owner UUID;
  related_type TEXT;
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

  IF NEW.related_expense_id IS NOT NULL THEN
    SELECT user_id, type INTO related_owner, related_type
    FROM transactions
    WHERE id = NEW.related_expense_id;

    IF related_owner IS NULL THEN
      RAISE EXCEPTION 'Related expense not found';
    END IF;

    IF related_owner <> NEW.user_id THEN
      RAISE EXCEPTION 'Related expense belongs to another user';
    END IF;

    IF NEW.type <> 'income' THEN
      RAISE EXCEPTION 'Related expense can only be set on income transactions';
    END IF;

    IF related_type <> 'expense' THEN
      RAISE EXCEPTION 'Related transaction must be an expense';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
