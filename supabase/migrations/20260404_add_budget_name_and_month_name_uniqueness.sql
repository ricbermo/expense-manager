-- Add explicit budget name and allow multiple budgets per category/month.
-- New uniqueness rule: one budget name per user and month (case-insensitive).

ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS name TEXT;

-- Initial backfill from category name for legacy records.
UPDATE budgets b
SET name = c.name
FROM categories c
WHERE b.category_id = c.id
  AND (b.name IS NULL OR btrim(b.name) = '');

-- Normalize empty names and resolve duplicates within (user_id, month, lower(name)).
WITH normalized AS (
  SELECT
    id,
    user_id,
    month,
    COALESCE(NULLIF(btrim(name), ''), 'Presupuesto') AS base_name
  FROM budgets
),
ranked AS (
  SELECT
    id,
    base_name,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, month, lower(base_name)
      ORDER BY id
    ) AS duplicate_rank
  FROM normalized
)
UPDATE budgets b
SET name = CASE
  WHEN ranked.duplicate_rank = 1 THEN ranked.base_name
  ELSE ranked.base_name || ' ' || ranked.duplicate_rank::TEXT
END
FROM ranked
WHERE b.id = ranked.id;

ALTER TABLE budgets
ALTER COLUMN name SET NOT NULL;

ALTER TABLE budgets
DROP CONSTRAINT IF EXISTS budgets_category_id_month_key;

CREATE UNIQUE INDEX IF NOT EXISTS budgets_user_month_name_unique_idx
ON budgets (user_id, month, lower(name));
