-- Add installments support for credit card purchases (cuotas sin intereses).
-- The transaction keeps the full amount on the credit card so the balance
-- reflects the real debt; the installment count is metadata used by the
-- monthly projection view defined below.

ALTER TABLE transactions
ADD COLUMN installments SMALLINT;

ALTER TABLE transactions
ADD CONSTRAINT transactions_installments_range
CHECK (installments IS NULL OR installments BETWEEN 1 AND 48);

CREATE INDEX idx_transactions_installments
ON transactions(account_id, date)
WHERE installments IS NOT NULL;

-- Extend ownership trigger to enforce that installments are only allowed on
-- expense transactions paid with a credit_card account.
CREATE OR REPLACE FUNCTION ensure_transaction_user_ownership()
RETURNS TRIGGER AS $$
DECLARE
  source_owner UUID;
  source_type TEXT;
  destination_owner UUID;
  category_owner UUID;
  budget_owner UUID;
  budget_category UUID;
  related_owner UUID;
  related_type TEXT;
BEGIN
  SELECT user_id, type INTO source_owner, source_type
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

  IF NEW.installments IS NOT NULL THEN
    IF NEW.type <> 'expense' THEN
      RAISE EXCEPTION 'Installments can only be set on expense transactions';
    END IF;

    IF source_type <> 'credit_card' THEN
      RAISE EXCEPTION 'Installments can only be set when paying with a credit card account';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Monthly installment projection: explodes each installment purchase into one
-- row per scheduled month with the per-cuota amount. Non-installment
-- transactions are excluded.
CREATE OR REPLACE VIEW transaction_installments_projection AS
SELECT
  t.id AS transaction_id,
  t.user_id,
  t.account_id,
  t.description,
  t.amount AS total_amount,
  t.installments,
  t.date AS purchase_date,
  gs.installment_number,
  (date_trunc('month', t.date) + (gs.installment_number - 1) * INTERVAL '1 month')::date
    AS scheduled_month,
  -- Distribute amount across cuotas; remainder goes to the last cuota so the
  -- sum matches the purchase total exactly.
  CASE
    WHEN gs.installment_number < t.installments
      THEN t.amount / t.installments
    ELSE t.amount - (t.amount / t.installments) * (t.installments - 1)
  END AS scheduled_amount
FROM transactions t
CROSS JOIN LATERAL generate_series(1, t.installments) AS gs(installment_number)
WHERE t.installments IS NOT NULL AND t.installments >= 2;
