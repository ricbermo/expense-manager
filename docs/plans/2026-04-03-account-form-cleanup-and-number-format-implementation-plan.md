# Account Form Cleanup And Number Format Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Limpiar el formulario de cuentas al guardar, mostrar labels legibles en el dropdown de tipo y aplicar formato/mascara a todos los inputs numericos sin romper el payload numerico.

**Architecture:** Se centraliza la logica en `account-form.tsx` con helpers puros para sanitizar/parsear/formatear valores numericos, un mapa de labels para tipos de cuenta y una rutina de reset/sincronizacion de estado al abrir/cerrar el dialog. La persistencia mantiene el contrato actual (`number | null`) y reutiliza `normalizeStoredBalance`.

**Tech Stack:** React 19, Next.js 16 (App Router), TypeScript, Base UI Select, Tailwind.

---

### Task 1: Estabilizar estado inicial y reset del formulario

**Files:**
- Modify: `src/components/accounts/account-form.tsx`

**Step 1: Write the failing test**

Escenario manual que hoy falla:
- Abrir "Nueva cuenta".
- Llenar campos y guardar.
- Reabrir "Nueva cuenta".
- Esperado: campos limpios.
- Actual: algunos campos conservan valores anteriores.

**Step 2: Run test to verify it fails**

Run: `npm run dev`
Expected: El escenario manual reproduce que el estado no se limpia de forma consistente.

**Step 3: Write minimal implementation**

- Crear `resetForm(data?: Account)` para inicializar todos los `useState`.
- Usar `useEffect` para sincronizar cuando cambia `open`/`initialData`.
- En submit exitoso, cerrar modal y llamar `resetForm()` para modo nuevo.

**Step 4: Run test to verify it passes**

Run: `npm run dev`
Expected: Al reabrir "Nueva cuenta" despues de guardar, los campos quedan limpios.

**Step 5: Commit**

```bash
git add src/components/accounts/account-form.tsx
git commit -m "fix: reset account form state after successful submit"
```

### Task 2: Corregir render del dropdown de tipo de cuenta

**Files:**
- Modify: `src/components/accounts/account-form.tsx`

**Step 1: Write the failing test**

Escenario manual que hoy falla:
- Abrir formulario de cuenta.
- Revisar trigger de `Tipo`.
- Esperado: texto legible (`Ahorros`, `Tarjeta de Credito`, `Prestamo`).
- Actual: puede mostrarse valor tecnico del enum (`credit_card`, etc.).

**Step 2: Run test to verify it fails**

Run: `npm run dev`
Expected: Se observa el valor tecnico en algun flujo de render del select.

**Step 3: Write minimal implementation**

- Definir `accountTypeLabels: Record<AccountType, string>`.
- Renderizar label explicito en `SelectValue` para el `type` actual.
- Mantener `value` de `SelectItem` como enums existentes.

**Step 4: Run test to verify it passes**

Run: `npm run dev`
Expected: Siempre se ve label legible en el trigger del select de tipo.

**Step 5: Commit**

```bash
git add src/components/accounts/account-form.tsx
git commit -m "fix: show user-friendly account type labels in selector"
```

### Task 3: Aplicar mascara/formato a `Saldo/Deuda` y `Cupo`

**Files:**
- Modify: `src/components/accounts/account-form.tsx`

**Step 1: Write the failing test**

Escenario manual que hoy falla:
- Escribir `5000000` en `Saldo` y `Cupo`.
- Esperado: visual `5.000.000` mientras se digita.
- Actual: se ve numero crudo sin formato.

**Step 2: Run test to verify it fails**

Run: `npm run dev`
Expected: los campos se muestran sin separador de miles.

**Step 3: Write minimal implementation**

- Cambiar manejo de campos a texto controlado con sanitizacion de digitos.
- Agregar helper de formato de miles (`es-CO`) para enteros.
- Mantener parseo a `number` solo en submit.

**Step 4: Run test to verify it passes**

Run: `npm run dev`
Expected: `Saldo/Deuda` y `Cupo` muestran separador de miles y guardan valor numerico correcto.

**Step 5: Commit**

```bash
git add src/components/accounts/account-form.tsx
git commit -m "feat: add thousands formatting for account amount inputs"
```

### Task 4: Aplicar formato a `Tasa` y validacion de `Dia de pago`

**Files:**
- Modify: `src/components/accounts/account-form.tsx`

**Step 1: Write the failing test**

Escenario manual que hoy falla:
- `Tasa`: entradas con `,` y `.` no siempre quedan normalizadas.
- `Dia de pago`: se permiten caracteres no numericos o rangos invalidos.

**Step 2: Run test to verify it fails**

Run: `npm run dev`
Expected: se detecta falta de normalizacion/limite consistente.

**Step 3: Write minimal implementation**

- `Tasa`: aceptar un separador decimal, normalizar a `.` y limitar precision (2 decimales).
- `Dia de pago`: limpiar a solo digitos, parsear a entero y acotar a rango `1-31` en submit.
- Conservar nulabilidad por tipo de cuenta (`savings` no usa tasa ni dia).

**Step 4: Run test to verify it passes**

Run: `npm run dev`
Expected: campos validan/formatean correctamente y persisten valores esperados.

**Step 5: Commit**

```bash
git add src/components/accounts/account-form.tsx
git commit -m "feat: normalize interest and due-day numeric inputs"
```

### Task 5: Verificacion final y endurecimiento

**Files:**
- Modify: `src/components/accounts/account-form.tsx` (solo si surge ajuste menor)

**Step 1: Write the failing test**

Checklist final de regresion:
- Crear cuenta nueva -> formulario limpio al reabrir.
- Editar cuenta -> precarga correcta.
- Tipo muestra label legible.
- Todos los numericos con formato visible.
- Cambiar entre tipos no arrastra datos no aplicables.

**Step 2: Run test to verify it fails**

Run: `npm run lint`
Expected: si hay errores de tipos/estilo, fallan aqui antes del cierre.

**Step 3: Write minimal implementation**

- Corregir warnings/errores que aparezcan.
- Ajustar casos borde detectados por QA manual.

**Step 4: Run test to verify it passes**

Run: `npm run lint`
Expected: salida sin errores.

**Step 5: Commit**

```bash
git add src/components/accounts/account-form.tsx
git commit -m "fix: finalize account form numeric formatting and reset behavior"
```
