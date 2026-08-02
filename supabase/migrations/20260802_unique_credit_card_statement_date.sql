-- A statement is registered once per account per closing date. Double
-- registration inserted duplicate rows, so the dashboard "Requiere atención"
-- list showed the same statement twice.
--
-- Reassign any payments from duplicate rows to the earliest row, drop the
-- rest, then enforce uniqueness going forward. The payments table may not
-- exist yet in older databases, so guard that step.

DO $$
BEGIN
  IF to_regclass('public.credit_card_statement_payments') IS NOT NULL THEN
    UPDATE credit_card_statement_payments p
    SET statement_id = k.id
    FROM credit_card_statements d
    JOIN credit_card_statements k
      ON k.account_id = d.account_id
     AND k.statement_date = d.statement_date
     AND (k.created_at, k.id) < (d.created_at, d.id)
    WHERE p.statement_id = d.id;
  END IF;
END $$;

DELETE FROM credit_card_statements d
USING credit_card_statements k
WHERE d.account_id = k.account_id
  AND d.statement_date = k.statement_date
  AND (d.created_at, d.id) > (k.created_at, k.id);

ALTER TABLE credit_card_statements
  ADD CONSTRAINT credit_card_statements_account_date_unique
  UNIQUE (account_id, statement_date);