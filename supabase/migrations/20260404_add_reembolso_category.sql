-- Add "Reembolso" income category for reimbursement tracking
INSERT INTO categories (user_id, name, icon, color, type)
SELECT id, 'Reembolso', 'rotate-ccw', '#64748b', 'income'
FROM auth.users
WHERE lower(email) = lower('rickardoberdejo@gmail.com')
AND NOT EXISTS (
  SELECT 1 FROM categories
  WHERE name = 'Reembolso' AND type = 'income'
  AND user_id = (SELECT id FROM auth.users WHERE lower(email) = lower('rickardoberdejo@gmail.com') LIMIT 1)
);
