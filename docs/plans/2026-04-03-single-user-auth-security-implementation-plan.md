# Single-user Auth Security Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Proteger completamente la app pública con autenticación obligatoria, acceso exclusivo para `rickardoberdejo@gmail.com` y RLS estricta para impedir lectura/escritura no autorizada.

**Architecture:** Se agrega una capa de autenticación en la app (ruta `/login`, guard de rutas privadas en `src/proxy.ts`, y cierre de sesión explícito en UI). En base de datos, se incorpora `user_id` en tablas de negocio y se reemplazan políticas abiertas por políticas propietarias (`user_id = auth.uid()`) con restricción adicional por email permitido. La seguridad no dependerá del frontend: la base de datos aplicará el control final.

**Tech Stack:** Next.js 16 App Router (proxy file convention), React 19, TypeScript, Supabase Auth + Postgres RLS, Node test runner (`node:test`).

---

### Task 1: Crear utilidades de allowlist y pruebas unitarias

**Files:**
- Create: `src/lib/auth/allowed-user.ts`
- Test: `tests/allowed-user.test.mjs`

**Step 1: Write the failing test**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedUserEmail } from "../src/lib/auth/allowed-user.ts";

test("acepta el correo permitido", () => {
  assert.equal(isAllowedUserEmail("rickardoberdejo@gmail.com"), true);
});

test("rechaza correos distintos", () => {
  assert.equal(isAllowedUserEmail("otro@correo.com"), false);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/allowed-user.test.mjs`
Expected: FAIL por import/función no existente.

**Step 3: Write minimal implementation**

```ts
export const ALLOWED_USER_EMAIL = "rickardoberdejo@gmail.com";

export function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

export function isAllowedUserEmail(email: string | null | undefined) {
  return normalizeEmail(email) === normalizeEmail(ALLOWED_USER_EMAIL);
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/allowed-user.test.mjs`
Expected: PASS (2 tests).

**Step 5: Commit**

```bash
git add tests/allowed-user.test.mjs src/lib/auth/allowed-user.ts
git commit -m "test: add allowed-user email guard utility"
```

### Task 2: Implementar login con email/contraseña (sin registro público)

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/components/auth/login-form.tsx`
- Modify: `src/app/globals.css` (solo si se requiere estilo mínimo para login)

**Step 1: Write the failing test**

Escenario manual que hoy falla:
- Navegar a `/login`.
- Esperado: formulario de email/contraseña, submit funcional y estados de error/cargando.
- Actual: ruta inexistente.

**Step 2: Run test to verify it fails**

Run: `npm run dev`
Expected: 404 en `/login`.

**Step 3: Write minimal implementation**

Implementar formulario cliente que use `supabase.auth.signInWithPassword`:

```tsx
const { error } = await supabase.auth.signInWithPassword({ email, password });
if (error) setError("Credenciales inválidas");
else router.replace("/");
```

Requisitos UX mínimos:
- Botón deshabilitado durante submit.
- Mensaje de error legible.
- Sin botón de registro público.

**Step 4: Run test to verify it passes**

Run: `npm run dev`
Expected: `/login` renderiza correctamente y permite iniciar sesión con credenciales válidas.

**Step 5: Commit**

```bash
git add src/app/login/page.tsx src/components/auth/login-form.tsx src/app/globals.css
git commit -m "feat: add email-password login page"
```

### Task 3: Proteger rutas privadas con `proxy.ts` (Next.js 16)

**Files:**
- Create: `src/proxy.ts`
- Modify: `src/lib/supabase/server.ts` (solo si se extrae helper reutilizable de cookies)
- Test: `tests/route-access.test.mjs`
- Create: `src/lib/auth/route-access.ts`

**Step 1: Write the failing test**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { isPublicPath } from "../src/lib/auth/route-access.ts";

test("/login es publica", () => assert.equal(isPublicPath("/login"), true));
test("/accounts es privada", () => assert.equal(isPublicPath("/accounts"), false));
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/route-access.test.mjs`
Expected: FAIL por módulo/función no existente.

**Step 3: Write minimal implementation**

1) Crear helper puro de rutas (`isPublicPath`).

2) Crear `src/proxy.ts` usando el nuevo file convention de Next 16 y Supabase SSR:

```ts
export async function proxy(request: NextRequest) {
  // getUser desde cookies
  // if private && !user -> redirect('/login')
  // if private && !isAllowedUserEmail(user.email) -> redirect('/login?error=unauthorized')
  // if login && user permitido -> redirect('/')
  // return NextResponse.next()
}
```

3) Configurar `matcher` para cubrir rutas privadas (`/`, `/accounts/:path*`, `/transactions/:path*`, `/budgets/:path*`, `/login`).

**Step 4: Run test to verify it passes**

Run: `node --test tests/route-access.test.mjs && npm run lint`
Expected: PASS en tests y sin errores de lint.

**Step 5: Commit**

```bash
git add src/proxy.ts src/lib/auth/route-access.ts tests/route-access.test.mjs src/lib/supabase/server.ts
git commit -m "feat: guard private routes with next proxy and allowlist"
```

### Task 4: Añadir cierre de sesión y ocultar navegación en login

**Files:**
- Modify: `src/components/layout/bottom-nav.tsx`

**Step 1: Write the failing test**

Escenario manual que hoy falla:
- Usuario autenticado entra a cualquier ruta privada.
- Esperado: exista acción clara para cerrar sesión.
- Actual: no hay acción de logout.

**Step 2: Run test to verify it fails**

Run: `npm run dev`
Expected: no existe botón de “Cerrar sesión”; nav aparece igual en `/login`.

**Step 3: Write minimal implementation**

- Ocultar bottom nav cuando `pathname === "/login"`.
- Agregar acción “Salir” en la barra inferior:

```tsx
const supabase = createClient();
await supabase.auth.signOut();
router.replace("/login");
router.refresh();
```

**Step 4: Run test to verify it passes**

Run: `npm run dev`
Expected: logout funcional, sesión invalidada y nav no visible en `/login`.

**Step 5: Commit**

```bash
git add src/components/layout/bottom-nav.tsx
git commit -m "feat: add logout action and hide nav on login"
```

### Task 5: Endurecer esquema y políticas RLS en Supabase

**Files:**
- Create: `supabase/migrations/20260403_single_user_auth_hardening.sql`
- Modify: `supabase/schema.sql`

**Step 1: Write the failing test**

Prueba SQL/manual de estado actual:

```sql
select tablename, policyname, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('categories','accounts','transactions','budgets');
```

Expected (actual): aparecen políticas permisivas con `true`.

**Step 2: Run test to verify it fails**

Run: consulta SQL arriba en Supabase SQL Editor.
Expected: se confirma que hoy cualquier sesión puede leer/escribir todo.

**Step 3: Write minimal implementation**

En la migración:

1) Agregar `user_id uuid` en las 4 tablas.
2) Resolver owner histórico por email permitido:

```sql
select id into owner_id from auth.users where email = 'rickardoberdejo@gmail.com';
```

3) Backfill de `user_id` para filas existentes.
4) `ALTER COLUMN user_id SET NOT NULL` + `DEFAULT auth.uid()`.
5) Reemplazar políticas `USING (true)` por políticas estrictas:

```sql
using (user_id = auth.uid() and auth.jwt() ->> 'email' = 'rickardoberdejo@gmail.com')
with check (user_id = auth.uid() and auth.jwt() ->> 'email' = 'rickardoberdejo@gmail.com')
```

6) Añadir índices por `user_id`.
7) Añadir checks en `transactions`/`budgets` para garantizar que `account_id`, `to_account_id` y `category_id` pertenezcan al mismo usuario (vía trigger o `with check` con subqueries).

**Step 4: Run test to verify it passes**

Run:
- Aplicar migración (flujo habitual del proyecto).
- Re-ejecutar consulta de políticas.
- Probar desde app con sesión autorizada y no autorizada.

Expected:
- políticas abiertas eliminadas,
- solo usuario permitido puede operar,
- RLS bloquea acceso no autorizado.

**Step 5: Commit**

```bash
git add supabase/migrations/20260403_single_user_auth_hardening.sql supabase/schema.sql
git commit -m "feat: enforce single-user RLS ownership policies"
```

### Task 6: Alinear configuración y documentación operativa

**Files:**
- Modify: `.env.local.example`
- Modify: `README.md`

**Step 1: Write the failing test**

Checklist manual:
- No existe guía para activar auth + usuario permitido.
- Variables de entorno de seguridad no están documentadas.

**Step 2: Run test to verify it fails**

Run: revisión manual de `README.md` y `.env.local.example`.
Expected: falta documentación de seguridad.

**Step 3: Write minimal implementation**

- Documentar precondiciones:
  - crear usuario `rickardoberdejo@gmail.com` en Supabase Auth,
  - definir contraseña,
  - ejecutar migración,
  - probar flujo de login/logout.
- Agregar variable:

```env
ALLOWED_USER_EMAIL=rickardoberdejo@gmail.com
```

> Si se decide hardcodear correo en SQL/proxy, documentar explícitamente dónde modificarlo para futuras rotaciones.

**Step 4: Run test to verify it passes**

Run: revisión manual.
Expected: onboarding de seguridad reproducible para despliegue y local.

**Step 5: Commit**

```bash
git add README.md .env.local.example
git commit -m "docs: add single-user auth setup and security envs"
```

### Task 7: Verificación final integral (evidencia antes de cierre)

**Files:**
- Test: `tests/allowed-user.test.mjs`
- Test: `tests/route-access.test.mjs`
- Modify: `docs/plans/2026-04-03-single-user-auth-security-implementation-plan.md` (solo para anexar resultados de verificación si hace falta)

**Step 1: Write the failing test**

Definir checklist de regresión:
- acceso privado redirige a login sin sesión,
- usuario no permitido bloqueado,
- usuario permitido puede CRUD,
- logout limpia sesión,
- build/lint/tests sin errores.

**Step 2: Run test to verify it fails**

Run (antes de terminar ajustes):
`node --test tests/allowed-user.test.mjs tests/route-access.test.mjs && npm run lint && npm run build`

Expected: cualquier omisión pendiente aparece aquí.

**Step 3: Write minimal implementation**

- Corregir detalles residuales encontrados en lint/build/QA.

**Step 4: Run test to verify it passes**

Run:
`node --test tests/allowed-user.test.mjs tests/route-access.test.mjs && npm run lint && npm run build`

Expected: PASS en tests, lint limpio, build exitoso.

**Step 5: Commit**

```bash
git add src/proxy.ts src/app/login/page.tsx src/components/auth/login-form.tsx src/components/layout/bottom-nav.tsx src/lib/auth/allowed-user.ts src/lib/auth/route-access.ts tests/allowed-user.test.mjs tests/route-access.test.mjs supabase/migrations/20260403_single_user_auth_hardening.sql supabase/schema.sql README.md .env.local.example
git commit -m "feat: secure app with single-user auth and strict RLS"
```
