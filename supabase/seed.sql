-- Expense categories
INSERT INTO categories (name, icon, color, type) VALUES
  ('Alimentacion', 'shopping-cart', '#f97316', 'expense'),
  ('Transporte', 'car', '#3b82f6', 'expense'),
  ('Entretenimiento', 'gamepad-2', '#a855f7', 'expense'),
  ('Salud', 'heart-pulse', '#ef4444', 'expense'),
  ('Educacion', 'graduation-cap', '#06b6d4', 'expense'),
  ('Hogar', 'home', '#f59e0b', 'expense'),
  ('Ropa', 'shirt', '#ec4899', 'expense'),
  ('Restaurantes', 'utensils', '#f43f5e', 'expense'),
  ('Servicios', 'zap', '#eab308', 'expense'),
  ('Suscripciones', 'repeat', '#8b5cf6', 'expense'),
  ('Mascotas', 'paw-print', '#d97706', 'expense'),
  ('Otros gastos', 'more-horizontal', '#6b7280', 'expense');

-- Income categories
INSERT INTO categories (name, icon, color, type) VALUES
  ('Salario', 'banknote', '#10b981', 'income'),
  ('Freelance', 'laptop', '#14b8a6', 'income'),
  ('Otros ingresos', 'plus-circle', '#22c55e', 'income');
