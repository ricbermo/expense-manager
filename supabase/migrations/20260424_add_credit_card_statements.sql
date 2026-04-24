-- Credit card statement tracking
-- Allows recording monthly statement info: balance, minimum payment, and due date.
-- Payments are recorded as expense transactions with to_account_id = CC account.

CREATE TABLE credit_card_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  statement_date DATE NOT NULL,
  total_balance BIGINT NOT NULL,
  minimum_payment BIGINT NOT NULL,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE credit_card_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_statements" ON credit_card_statements
  FOR ALL USING (user_id = auth.uid());
