# Expense Tracker

Aplicación personal de control de gastos con Next.js + Supabase.

## Requisitos

- Node.js 20+
- Proyecto Supabase configurado

## Configuración local

1. Copia variables de entorno:

```bash
cp .env.local.example .env.local
```

2. Completa en `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `ALLOWED_USER_EMAIL` (por defecto: `rickardoberdejo@gmail.com`)

3. Instala dependencias y ejecuta:

```bash
npm install
npm run dev
```

## Seguridad (single-user)

Esta app está protegida para uso de un único usuario.

- Login obligatorio por email + contraseña (`/login`)
- Acceso permitido solo al correo configurado (`ALLOWED_USER_EMAIL`)
- Rutas privadas protegidas por `src/proxy.ts`
- Datos protegidos en PostgreSQL con RLS estricta por `user_id = auth.uid()`

## Pasos para habilitar seguridad en Supabase

1. Crea el usuario autorizado en **Supabase Auth**:
   - `rickardoberdejo@gmail.com`
   - define contraseña

2. Aplica migraciones SQL (incluye hardening de seguridad):
   - `supabase/migrations/20260403_single_user_auth_hardening.sql`

3. (Opcional) Ejecuta seed cuando el usuario autorizado exista:
   - `supabase/seed.sql`

4. Verifica:
   - sin sesión no se puede acceder a `/`, `/accounts`, `/transactions`, `/budgets`
   - correo no autorizado queda bloqueado
   - correo autorizado puede operar normalmente

## Scripts útiles

```bash
npm run dev
npm run lint
npm run build
node --test tests/*.test.mjs
```
