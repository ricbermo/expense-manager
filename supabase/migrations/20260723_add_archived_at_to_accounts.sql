ALTER TABLE accounts ADD COLUMN archived_at TIMESTAMPTZ;

CREATE INDEX idx_accounts_archived_at ON accounts (archived_at);
