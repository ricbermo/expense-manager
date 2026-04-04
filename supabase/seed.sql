DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE lower(email) = lower('rickardoberdejo@gmail.com')
  ) THEN
    RAISE EXCEPTION 'Create auth user rickardoberdejo@gmail.com before running seed';
  END IF;
END
$$;

-- Expense categories
INSERT INTO categories (user_id, name, icon, color, type) VALUES
  ((SELECT id FROM auth.users WHERE lower(email) = lower('rickardoberdejo@gmail.com') LIMIT 1), 'Alimentacion', 'shopping-cart', '#f97316', 'expense'),
  ((SELECT id FROM auth.users WHERE lower(email) = lower('rickardoberdejo@gmail.com') LIMIT 1), 'Transporte', 'car', '#3b82f6', 'expense'),
  ((SELECT id FROM auth.users WHERE lower(email) = lower('rickardoberdejo@gmail.com') LIMIT 1), 'Entretenimiento', 'gamepad-2', '#a855f7', 'expense'),
  ((SELECT id FROM auth.users WHERE lower(email) = lower('rickardoberdejo@gmail.com') LIMIT 1), 'Salud', 'heart-pulse', '#ef4444', 'expense'),
  ((SELECT id FROM auth.users WHERE lower(email) = lower('rickardoberdejo@gmail.com') LIMIT 1), 'Educacion', 'graduation-cap', '#06b6d4', 'expense'),
  ((SELECT id FROM auth.users WHERE lower(email) = lower('rickardoberdejo@gmail.com') LIMIT 1), 'Hogar', 'home', '#f59e0b', 'expense'),
  ((SELECT id FROM auth.users WHERE lower(email) = lower('rickardoberdejo@gmail.com') LIMIT 1), 'Ropa', 'shirt', '#ec4899', 'expense'),
  ((SELECT id FROM auth.users WHERE lower(email) = lower('rickardoberdejo@gmail.com') LIMIT 1), 'Restaurantes', 'utensils', '#f43f5e', 'expense'),
  ((SELECT id FROM auth.users WHERE lower(email) = lower('rickardoberdejo@gmail.com') LIMIT 1), 'Servicios', 'zap', '#eab308', 'expense'),
  ((SELECT id FROM auth.users WHERE lower(email) = lower('rickardoberdejo@gmail.com') LIMIT 1), 'Suscripciones', 'repeat', '#8b5cf6', 'expense'),
  ((SELECT id FROM auth.users WHERE lower(email) = lower('rickardoberdejo@gmail.com') LIMIT 1), 'Mascotas', 'paw-print', '#d97706', 'expense'),
  ((SELECT id FROM auth.users WHERE lower(email) = lower('rickardoberdejo@gmail.com') LIMIT 1), 'Otros gastos', 'more-horizontal', '#6b7280', 'expense');

-- Income categories
INSERT INTO categories (user_id, name, icon, color, type) VALUES
  ((SELECT id FROM auth.users WHERE lower(email) = lower('rickardoberdejo@gmail.com') LIMIT 1), 'Salario', 'banknote', '#10b981', 'income'),
  ((SELECT id FROM auth.users WHERE lower(email) = lower('rickardoberdejo@gmail.com') LIMIT 1), 'Freelance', 'laptop', '#14b8a6', 'income'),
  ((SELECT id FROM auth.users WHERE lower(email) = lower('rickardoberdejo@gmail.com') LIMIT 1), 'Reembolso', 'rotate-ccw', '#64748b', 'income'),
  ((SELECT id FROM auth.users WHERE lower(email) = lower('rickardoberdejo@gmail.com') LIMIT 1), 'Otros ingresos', 'plus-circle', '#22c55e', 'income');
