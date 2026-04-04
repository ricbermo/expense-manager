-- Merge "payment" type into "expense"
-- Payments are just expenses that optionally credit a destination account.
-- The to_account_id already supports this, so we just need to reclassify.

-- 1. Convert all existing payment transactions to expense
UPDATE transactions SET type = 'expense' WHERE type = 'payment';

-- 2. Update the CHECK constraint to remove 'payment'
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('expense', 'income', 'transfer'));

-- 3. Update the balance trigger to handle expenses with to_account_id
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type IN ('expense', 'transfer') THEN
      UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
      IF NEW.to_account_id IS NOT NULL THEN
        UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.to_account_id;
      END IF;
    ELSIF NEW.type = 'income' THEN
      UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type IN ('expense', 'transfer') THEN
      UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
      IF OLD.to_account_id IS NOT NULL THEN
        UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.to_account_id;
      END IF;
    ELSIF OLD.type = 'income' THEN
      UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
