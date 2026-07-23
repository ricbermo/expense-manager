-- Keep every installment linked to its statement and transfer. A statement is
-- settled only when the sum of its ledger rows covers the original balance.
CREATE TABLE credit_card_statement_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  statement_id UUID NOT NULL REFERENCES credit_card_statements(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE RESTRICT,
  amount BIGINT NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_card_statement_payments_statement_id
  ON credit_card_statement_payments(statement_id);

ALTER TABLE credit_card_statement_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "statement payments owner only" ON credit_card_statement_payments
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Existing records may predate these rules. NOT VALID keeps the migration
-- deployable while enforcing the constraints for every new statement.
ALTER TABLE credit_card_statements
  ADD CONSTRAINT credit_card_statements_total_balance_positive
    CHECK (total_balance > 0) NOT VALID,
  ADD CONSTRAINT credit_card_statements_minimum_payment_valid
    CHECK (minimum_payment > 0 AND minimum_payment <= total_balance) NOT VALID,
  ADD CONSTRAINT credit_card_statements_due_date_valid
    CHECK (due_date >= statement_date) NOT VALID;

-- Preserve the previous single-payment records as one ledger entry where the
-- referenced transfer still exists.
INSERT INTO credit_card_statement_payments (user_id, statement_id, transaction_id, amount, created_at)
SELECT s.user_id, s.id, s.payment_transaction_id, t.amount, COALESCE(s.paid_at, s.created_at)
FROM credit_card_statements s
JOIN transactions t ON t.id = s.payment_transaction_id
WHERE s.payment_transaction_id IS NOT NULL
ON CONFLICT (transaction_id) DO NOTHING;

CREATE OR REPLACE FUNCTION record_credit_card_statement_payment(
  p_statement_id UUID,
  p_source_account_id UUID,
  p_amount BIGINT,
  p_date DATE,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE (transaction_id UUID, remaining_amount BIGINT, settled BOOLEAN)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_statement credit_card_statements%ROWTYPE;
  v_source_account accounts%ROWTYPE;
  v_paid_amount BIGINT;
  v_transaction_id UUID;
  v_remaining_amount BIGINT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  IF p_date IS NULL THEN
    RAISE EXCEPTION 'Payment date is required';
  END IF;

  SELECT * INTO v_statement
  FROM credit_card_statements
  WHERE id = p_statement_id AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Statement not found';
  END IF;

  SELECT * INTO v_source_account
  FROM accounts
  WHERE id = p_source_account_id AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND OR v_source_account.type NOT IN ('savings', 'cash') THEN
    RAISE EXCEPTION 'A savings or cash account is required';
  END IF;

  IF v_source_account.balance < p_amount THEN
    RAISE EXCEPTION 'Source account does not have enough balance';
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_paid_amount
  FROM credit_card_statement_payments
  WHERE statement_id = v_statement.id;

  v_remaining_amount := v_statement.total_balance - v_paid_amount;

  IF p_amount > v_remaining_amount THEN
    RAISE EXCEPTION 'Payment exceeds the statement balance remaining';
  END IF;

  INSERT INTO transactions (
    user_id, type, amount, description, date, account_id, to_account_id,
    category_id, budget_id, related_expense_id, tags
  )
  VALUES (
    auth.uid(), 'transfer', p_amount, NULLIF(p_description, ''), p_date,
    v_source_account.id, v_statement.account_id, NULL, NULL, NULL, '{}'
  )
  RETURNING id INTO v_transaction_id;

  INSERT INTO credit_card_statement_payments (user_id, statement_id, transaction_id, amount)
  VALUES (auth.uid(), v_statement.id, v_transaction_id, p_amount);

  v_remaining_amount := v_remaining_amount - p_amount;

  UPDATE credit_card_statements
  SET paid_at = CASE WHEN v_remaining_amount = 0 THEN COALESCE(paid_at, now()) ELSE NULL END,
      payment_transaction_id = CASE WHEN v_remaining_amount = 0 THEN v_transaction_id ELSE NULL END
  WHERE id = v_statement.id;

  RETURN QUERY SELECT v_transaction_id, v_remaining_amount, v_remaining_amount = 0;
END;
$$;
