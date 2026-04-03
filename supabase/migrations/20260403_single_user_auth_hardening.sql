-- Single-user auth hardening:
-- - Add owner column (user_id) to business tables
-- - Backfill existing rows to allowed owner
-- - Replace permissive RLS policies with strict owner+email checks
-- - Enforce foreign ownership consistency

BEGIN;

DO $$
DECLARE
  owner_id UUID;
BEGIN
  SELECT id
  INTO owner_id
  FROM auth.users
  WHERE lower(email) = lower('rickardoberdejo@gmail.com')
  LIMIT 1;

  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'Create auth user rickardoberdejo@gmail.com before running this migration';
  END IF;

  ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id UUID;
  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS user_id UUID;
  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id UUID;
  ALTER TABLE budgets ADD COLUMN IF NOT EXISTS user_id UUID;

  UPDATE categories SET user_id = owner_id WHERE user_id IS NULL;
  UPDATE accounts SET user_id = owner_id WHERE user_id IS NULL;
  UPDATE transactions SET user_id = owner_id WHERE user_id IS NULL;
  UPDATE budgets SET user_id = owner_id WHERE user_id IS NULL;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_user_id_fkey'
  ) THEN
    ALTER TABLE categories
      ADD CONSTRAINT categories_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'accounts_user_id_fkey'
  ) THEN
    ALTER TABLE accounts
      ADD CONSTRAINT accounts_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_user_id_fkey'
  ) THEN
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'budgets_user_id_fkey'
  ) THEN
    ALTER TABLE budgets
      ADD CONSTRAINT budgets_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END
$$;

ALTER TABLE categories ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE accounts ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE transactions ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE budgets ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE categories ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE accounts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE budgets ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);

-- Replace permissive policies (legacy)
DROP POLICY IF EXISTS "Allow all on categories" ON categories;
DROP POLICY IF EXISTS "Allow all on accounts" ON accounts;
DROP POLICY IF EXISTS "Allow all on transactions" ON transactions;
DROP POLICY IF EXISTS "Allow all on budgets" ON budgets;

DROP POLICY IF EXISTS "categories owner only" ON categories;
DROP POLICY IF EXISTS "accounts owner only" ON accounts;
DROP POLICY IF EXISTS "transactions owner only" ON transactions;
DROP POLICY IF EXISTS "budgets owner only" ON budgets;

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

-- Enforce ownership consistency across references
CREATE OR REPLACE FUNCTION ensure_transaction_user_ownership()
RETURNS TRIGGER AS $$
DECLARE
  source_owner UUID;
  destination_owner UUID;
  category_owner UUID;
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ensure_transaction_user_ownership ON transactions;
CREATE TRIGGER trg_ensure_transaction_user_ownership
BEFORE INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION ensure_transaction_user_ownership();

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

DROP TRIGGER IF EXISTS trg_ensure_budget_user_ownership ON budgets;
CREATE TRIGGER trg_ensure_budget_user_ownership
BEFORE INSERT OR UPDATE ON budgets
FOR EACH ROW
EXECUTE FUNCTION ensure_budget_user_ownership();

COMMIT;
