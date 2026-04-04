# Budget Name and Editing Design

## Contexto

Actualmente los presupuestos se modelan por `categoria + mes` con unicidad (`UNIQUE(category_id, month)`), lo que impide tener más de un presupuesto en la misma categoría para un mismo mes.

Necesitamos permitir:

1. Nombrar explícitamente cada presupuesto (ej. `Almuerzos`).
2. Asociarlo a una categoría (ej. `Administración`).
3. Editar presupuestos existentes (nombre, categoría y límite).
4. Crear múltiples presupuestos en la misma categoría y mes.

## Objetivos

- Agregar campo `name` al modelo de presupuestos.
- Permitir múltiples presupuestos por `category_id` dentro del mismo mes.
- Mantener unicidad por nombre dentro de cada mes y usuario.
- Habilitar edición completa de presupuestos desde la UI.
- Mejorar el selector de presupuesto en transacciones para mostrar `Nombre · Categoría`.

## Decisiones confirmadas

- Se permite múltiples presupuestos en la misma categoría y mes.
- Regla de unicidad: `name` único por `user + month` (case-insensitive).
- `name` será obligatorio.

## Enfoque seleccionado

Extender la tabla `budgets` con `name`, reemplazar la unicidad por categoría con una unicidad por nombre mensual, y separar operaciones de creación/edición en frontend (en lugar de `upsert` por `category_id,month`).

Razonamiento: minimiza cambios estructurales (sin nuevas tablas), conserva el flujo actual de gasto por categoría derivada y habilita el comportamiento solicitado.

## Diseño técnico

### 1) Base de datos

- `budgets.name TEXT NOT NULL`.
- Migración de datos actuales: `name = categories.name`.
- Reemplazo de unicidad:
  - eliminar `UNIQUE(category_id, month)`
  - agregar índice único: `UNIQUE (user_id, month, lower(name))`

### 2) Capa de datos en frontend

- Reemplazar `upsertBudget(categoryId, limitAmount)` por:
  - `createBudget({ name, categoryId, limitAmount })`
  - `updateBudget({ id, name, categoryId, limitAmount })`
- Mantener `deleteBudget(id)`.
- En `copyFromPreviousMonth`, incluir `name` en la copia.

### 3) UI de presupuestos

- Formulario con campos: `name`, `category`, `limit`.
- Modo crear y modo editar con el mismo diálogo.
- Tarjeta de presupuesto:
  - título principal: `budget.name`
  - subtítulo: `budget.categories.name`
  - acciones: editar y eliminar.

### 4) UI de transacciones

- Selector de presupuesto en gastos muestra `Nombre · Categoría`.
- Se mantiene mapeo actual: al guardar gasto, se deriva `category_id` desde el presupuesto seleccionado.

### 5) Errores y validaciones

- Validación de `name` obligatorio y con `trim`.
- Error de nombre duplicado por mes: mensaje claro en español.

## Riesgos y mitigación

- **Colisiones de nombres durante migración**: resolver con sufijos incrementales automáticos.
- **Cambios de categoría al editar**: mantener visible la categoría secundaria en tarjeta y select para evitar confusión.
- **Regresión en copia de mes**: actualizar operación de copia para incluir `name` y respetar unicidad.

## Verificación

1. Crear dos presupuestos en la misma categoría/mes con nombres distintos.
2. Intentar duplicar nombre en el mismo mes (debe fallar con mensaje claro).
3. Editar nombre/categoría/límite y confirmar persistencia.
4. Verificar selector de gastos con etiqueta `Nombre · Categoría`.
5. Copiar presupuestos del mes anterior y validar que conserva nombres.
