-- Categories
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Accounts
CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('savings', 'credit_card', 'loan')),
  balance BIGINT NOT NULL DEFAULT 0,
  credit_limit BIGINT,
  interest_rate DECIMAL(5,2),
  due_day SMALLINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Transactions
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount BIGINT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer', 'payment')),
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category_id UUID REFERENCES categories(id),
  account_id UUID NOT NULL REFERENCES accounts(id),
  to_account_id UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Budgets
CREATE TABLE budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES categories(id),
  month DATE NOT NULL,
  limit_amount BIGINT NOT NULL,
  UNIQUE(category_id, month)
);

-- Indexes
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_budgets_month ON budgets(month);

-- Trigger: auto-update account balances
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

CREATE TRIGGER trg_update_account_balance
AFTER INSERT OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- Disable RLS (single user app)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on accounts" ON accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on budgets" ON budgets FOR ALL USING (true) WITH CHECK (true);
