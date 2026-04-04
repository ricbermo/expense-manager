-- Categories
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Accounts
CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('savings', 'cash', 'credit_card', 'loan')),
  balance BIGINT NOT NULL DEFAULT 0,
  credit_limit BIGINT,
  interest_rate DECIMAL(5,2),
  due_day SMALLINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Transactions
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category_id UUID REFERENCES categories(id),
  budget_id UUID,
  related_expense_id UUID,
  account_id UUID NOT NULL REFERENCES accounts(id),
  to_account_id UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Budgets
CREATE TABLE budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  month DATE NOT NULL,
  limit_amount BIGINT NOT NULL
);

ALTER TABLE transactions
ADD CONSTRAINT transactions_budget_id_fkey
FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE SET NULL;

ALTER TABLE transactions
ADD CONSTRAINT transactions_related_expense_id_fkey
FOREIGN KEY (related_expense_id) REFERENCES transactions(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_budget ON transactions(budget_id);
CREATE INDEX idx_transactions_related_expense ON transactions(related_expense_id);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_budgets_month ON budgets(month);
CREATE UNIQUE INDEX idx_budgets_user_month_name ON budgets(user_id, month, lower(name));

-- Trigger: enforce referenced row ownership for transactions
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

CREATE TRIGGER trg_ensure_transaction_user_ownership
BEFORE INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION ensure_transaction_user_ownership();

-- Trigger: enforce budget category ownership
CREATE OR REPLACE FUNCTION ensure_budget_user_ownership()
RETURNS TRIGGER AS $$
DECLARE
  category_owner UUID;
BEGIN
  SELECT user_id INTO category_owner
  FROM categories
  WHERE id = NEW.category_id;

  IF category_owner IS NULL THEN
    RAISE EXCEPTION 'Category not found';
  END IF;

  IF category_owner <> NEW.user_id THEN
    RAISE EXCEPTION 'Budget category belongs to another user';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ensure_budget_user_ownership
BEFORE INSERT OR UPDATE ON budgets
FOR EACH ROW
EXECUTE FUNCTION ensure_budget_user_ownership();

-- Trigger: auto-update account balances
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

CREATE TRIGGER trg_update_account_balance
AFTER INSERT OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- Row-level security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories owner only" ON categories
FOR ALL
USING (
  user_id = auth.uid()
  AND COALESCE(auth.jwt() ->> 'email', '') = 'rickardoberdejo@gmail.com'
)
WITH CHECK (
  user_id = auth.uid()
  AND COALESCE(auth.jwt() ->> 'email', '') = 'rickardoberdejo@gmail.com'
);

CREATE POLICY "accounts owner only" ON accounts
FOR ALL
USING (
  user_id = auth.uid()
  AND COALESCE(auth.jwt() ->> 'email', '') = 'rickardoberdejo@gmail.com'
)
WITH CHECK (
  user_id = auth.uid()
  AND COALESCE(auth.jwt() ->> 'email', '') = 'rickardoberdejo@gmail.com'
);

CREATE POLICY "transactions owner only" ON transactions
FOR ALL
USING (
  user_id = auth.uid()
  AND COALESCE(auth.jwt() ->> 'email', '') = 'rickardoberdejo@gmail.com'
)
WITH CHECK (
  user_id = auth.uid()
  AND COALESCE(auth.jwt() ->> 'email', '') = 'rickardoberdejo@gmail.com'
);

CREATE POLICY "budgets owner only" ON budgets
FOR ALL
USING (
  user_id = auth.uid()
  AND COALESCE(auth.jwt() ->> 'email', '') = 'rickardoberdejo@gmail.com'
)
WITH CHECK (
  user_id = auth.uid()
  AND COALESCE(auth.jwt() ->> 'email', '') = 'rickardoberdejo@gmail.com'
);
