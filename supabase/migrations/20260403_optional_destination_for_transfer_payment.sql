-- Allow transfer/payment rows without destination account.
-- Keeps internal transfer behavior when destination exists.

BEGIN;

CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'expense' THEN
      UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'income' THEN
      UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type IN ('transfer', 'payment') THEN
      UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
      IF NEW.to_account_id IS NOT NULL THEN
        UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.to_account_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'expense' THEN
      UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'income' THEN
      UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type IN ('transfer', 'payment') THEN
      UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
      IF OLD.to_account_id IS NOT NULL THEN
        UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.to_account_id;
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMIT;
