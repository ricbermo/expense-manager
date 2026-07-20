-- Add status column for pending review (e.g., SMS-automated transactions)
ALTER TABLE transactions
ADD COLUMN status TEXT NOT NULL DEFAULT 'confirmed'
  CHECK (status IN ('confirmed', 'pending'));

CREATE INDEX idx_transactions_status ON transactions(status)
  WHERE status = 'pending';