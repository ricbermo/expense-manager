# Budget Name and Editing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Permitir crear y editar presupuestos con nombre propio y categoría, soportando múltiples presupuestos por categoría en un mismo mes.

**Architecture:** Se agrega `name` a `budgets`, se reemplaza la unicidad por categoría/mes con unicidad por `user + month + name`, y se actualiza la UI para crear/editar presupuestos y mostrar mejor contexto (`Nombre · Categoría`) en transacciones.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Supabase, SWR, react-hook-form.

---

### Task 1: Migración de `budgets` para nombre obligatorio y nueva unicidad

**Files:**
- Create: `supabase/migrations/20260404_add_budget_name_and_month_name_uniqueness.sql`
- Modify: `supabase/schema.sql`

**Steps:**
1. Agregar columna `name`.
2. Backfill de registros existentes.
3. Eliminar unicidad `(category_id, month)`.
4. Crear unicidad `(user_id, month, lower(name))`.

### Task 2: Actualizar tipos y hook de presupuestos

**Files:**
- Modify: `src/lib/types/database.ts`
- Modify: `src/lib/hooks/use-budgets.ts`

**Steps:**
1. Agregar `name` al tipo `Budget`.
2. Reemplazar `upsertBudget` por `createBudget` y `updateBudget`.
3. Ajustar `copyFromPreviousMonth` para incluir `name`.

### Task 3: Soportar crear/editar en `BudgetForm`

**Files:**
- Modify: `src/components/budgets/budget-form.tsx`

**Steps:**
1. Agregar input de nombre.
2. Introducir `mode` (`create|edit`) e `initialBudget`.
3. Mantener validaciones de formulario y submit.

### Task 4: Integrar edición desde página y tarjeta

**Files:**
- Modify: `src/components/budgets/budget-card.tsx`
- Modify: `src/app/budgets/page.tsx`

**Steps:**
1. Mostrar nombre principal + categoría secundaria.
2. Agregar botón de editar en tarjeta.
3. Conectar `BudgetForm` en modo crear/editar.

### Task 5: Mejorar selector de presupuesto en transacciones

**Files:**
- Modify: `src/components/transactions/transaction-form.tsx`

**Steps:**
1. Mostrar `Nombre · Categoría` en opciones.
2. Mantener envío de `category_id` derivado del presupuesto.

### Task 6: Verificación

**Steps:**
1. Run: `npm run lint`.
2. Run: `npm run build`.
3. Ejecutar checklist manual funcional de creación/edición/selección.
