# Cash Account Type Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Agregar `cash/efectivo` como tipo de cuenta y hacerlo compatible con los mismos flujos operativos de `savings`.

**Architecture:** Se extiende el dominio (`AccountType`) con `cash`, se mantiene la semantica de balance para pasivos sin cambios, y se reemplazan filtros rigidos por una regla de cuenta liquida reutilizable (`savings` o `cash`). El ajuste se concentra en tipos, utilidades y componentes de cuentas/movimientos sin cambiar el contrato de payloads.

**Tech Stack:** React 19, Next.js 16 (App Router), TypeScript, Supabase, Tailwind, Base UI Select.

---

### Task 1: Extender el dominio con `cash`

**Files:**
- Modify: `src/lib/types/database.ts`

**Step 1: Write the failing test**

Escenario manual que hoy falla:
- Abrir formulario de cuentas.
- Intentar modelar una cuenta en efectivo.
- Esperado: exista un tipo para efectivo en dominio/UI.
- Actual: solo existen `savings`, `credit_card`, `loan`.

**Step 2: Run test to verify it fails**

Run: `npm run lint`
Expected: el codigo no contempla `cash` y los mapas tipados no permiten usarlo.

**Step 3: Write minimal implementation**

- Agregar `"cash"` a `AccountType` en `src/lib/types/database.ts`.

**Step 4: Run test to verify it passes**

Run: `npm run lint`
Expected: sin errores de tipo por la extension del union en este archivo.

**Step 5: Commit**

```bash
git add src/lib/types/database.ts
git commit -m "feat: add cash to account type domain"
```

### Task 2: Consolidar regla de cuentas liquidas para movimientos

**Files:**
- Modify: `src/components/transactions/transaction-form.tsx`

**Step 1: Write the failing test**

Escenario manual que hoy falla:
- Crear cuenta tipo `cash`.
- Abrir "Nuevo movimiento".
- Seleccionar `income`, `transfer` o `payment`.
- Esperado: `cash` aparezca como cuenta elegible.
- Actual: los filtros estan limitados a `type === "savings"`.

**Step 2: Run test to verify it fails**

Run: `npm run dev`
Expected: en UI, `cash` no aparece en los selects filtrados por ahorro.

**Step 3: Write minimal implementation**

- Crear helper local `isLiquidAccount(type)` en `transaction-form.tsx`.
- Reemplazar `savingsAccounts` por `liquidAccounts` usando `isLiquidAccount`.
- Usar `liquidAccounts` para `originAccounts` y `destinationAccounts` en `income/transfer/payment`.
- Ajustar mensaje vacio para indicar ausencia de cuentas de ahorro/efectivo.

**Step 4: Run test to verify it passes**

Run: `npm run dev`
Expected: `cash` se puede seleccionar en los flujos liquidos y se mantienen reglas actuales (destino opcional y no misma cuenta).

**Step 5: Commit**

```bash
git add src/components/transactions/transaction-form.tsx
git commit -m "feat: include cash accounts in liquid transaction flows"
```

### Task 3: Soportar `cash` en formulario de cuentas

**Files:**
- Modify: `src/components/accounts/account-form.tsx`

**Step 1: Write the failing test**

Escenario manual que hoy falla:
- Abrir "Nueva cuenta".
- Revisar selector de tipo.
- Esperado: opcion `Efectivo` visible y seleccionable.
- Actual: no existe opcion para efectivo.

**Step 2: Run test to verify it fails**

Run: `npm run dev`
Expected: el dropdown no lista `Efectivo`.

**Step 3: Write minimal implementation**

- Agregar `cash: "Efectivo"` a `accountTypeLabels`.
- Agregar `<SelectItem value="cash">Efectivo</SelectItem>` en el selector.
- Mantener reglas condicionales existentes para campos financieros.

**Step 4: Run test to verify it passes**

Run: `npm run dev`
Expected: se puede crear/editar cuenta con tipo `Efectivo`.

**Step 5: Commit**

```bash
git add src/components/accounts/account-form.tsx
git commit -m "feat: add cash option to account form type selector"
```

### Task 4: Soportar `cash` en tarjetas de cuenta

**Files:**
- Modify: `src/components/accounts/account-card.tsx`

**Step 1: Write the failing test**

Escenario manual que hoy falla:
- Crear cuenta `cash`.
- Ir a listado de cuentas.
- Esperado: tarjeta con icono/label/acento valido.
- Actual: mapas tipados no contemplan `cash`.

**Step 2: Run test to verify it fails**

Run: `npm run lint`
Expected: errores de TypeScript por claves faltantes en `accountIcons`, `accountLabels` o `accentByType`.

**Step 3: Write minimal implementation**

- Agregar `cash` a mapas de icono, label y acento en `account-card.tsx`.
- Usar un icono coherente (por ejemplo `Banknote` o equivalente de `lucide-react`).

**Step 4: Run test to verify it passes**

Run: `npm run lint`
Expected: compilacion sin errores y render correcto de tarjetas `cash`.

**Step 5: Commit**

```bash
git add src/components/accounts/account-card.tsx
git commit -m "feat: render cash account type in account cards"
```

### Task 5: Verificar semantica de balance y regresion final

**Files:**
- Modify: `src/lib/utils/account-balance.ts` (solo si se requiere ajuste explicito)
- Modify: `src/components/transactions/transaction-form.tsx` (solo ajustes menores)
- Modify: `src/components/accounts/account-form.tsx` (solo ajustes menores)
- Modify: `src/components/accounts/account-card.tsx` (solo ajustes menores)

**Step 1: Write the failing test**

Checklist de regresion:
- `cash` no invierte signo de balance.
- `credit_card` y `loan` conservan comportamiento actual.
- `income/transfer/payment` aceptan `cash`.
- No se rompe regla de no seleccionar misma cuenta origen/destino.

**Step 2: Run test to verify it fails**

Run: `npm run lint && npm run build`
Expected: cualquier omision de tipado/regla aparece antes del cierre.

**Step 3: Write minimal implementation**

- Ajustar condicionales residuales que aun dependan de `type === "savings"` si afectan el flujo objetivo.
- Corregir textos de UX o validaciones menores detectadas en QA manual.

**Step 4: Run test to verify it passes**

Run: `npm run lint && npm run build`
Expected: sin errores de lint/build y flujo manual validado.

**Step 5: Commit**

```bash
git add src/lib/utils/account-balance.ts src/components/transactions/transaction-form.tsx src/components/accounts/account-form.tsx src/components/accounts/account-card.tsx
git commit -m "feat: support cash account type across account and transaction flows"
```
