-- Allow cash accounts in accounts.type check constraint.
-- Idempotent for environments with existing/legacy constraint names.

BEGIN;

DO $$
DECLARE
  current_constraint RECORD;
BEGIN
  FOR current_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'accounts'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%type%'
      AND pg_get_constraintdef(oid) ILIKE '%savings%'
  LOOP
    EXECUTE format(
      'ALTER TABLE accounts DROP CONSTRAINT %I',
      current_constraint.conname
    );
  END LOOP;
END
$$;

ALTER TABLE accounts
ADD CONSTRAINT accounts_type_check
CHECK (type IN ('savings', 'cash', 'credit_card', 'loan'));

COMMIT;
