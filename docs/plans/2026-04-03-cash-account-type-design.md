## Contexto

Se requiere agregar `efectivo/cash` como nuevo tipo de cuenta para representar dinero disponible fuera de banco, manteniendo consistencia con los flujos actuales.

Actualmente, varios formularios y validaciones asumen que solo `savings` representa cuentas liquidas para ingresos, transferencias y pagos.

## Objetivos

- Agregar `cash` como `AccountType` valido en toda la app.
- Mostrar `Efectivo` como opcion y label legible en UI de cuentas.
- Hacer que `cash` se comporte como `savings` en flujos de movimientos (`income`, `transfer`, `payment`).
- Mantener semantica de saldo: `cash` no es pasivo y no invierte signo.

## Alcance

- Tipos de dominio y utilidades de balance:
  - `src/lib/types/database.ts`
  - `src/lib/utils/account-balance.ts`
- UI y catalogos de tipo de cuenta:
  - `src/components/accounts/account-form.tsx`
  - `src/components/accounts/account-card.tsx`
- Filtros de cuentas por tipo en registro de movimientos:
  - `src/components/transactions/transaction-form.tsx`
- No se cambia estructura de payload ni contratos de hooks.

## Enfoque seleccionado

Se adopta un enfoque de extension de dominio + helper semantico para cuentas liquidas.

- Extender el enum de tipos con `cash`.
- Reemplazar filtros estrictos por `type === "savings"` con una regla reutilizable de cuenta liquida (`savings` o `cash`).

Razon: minimiza riesgo, evita duplicar condicionales y deja la base lista para futuros tipos con comportamiento similar.

## Diseno tecnico

### 1) Tipado de dominio

- Actualizar `AccountType` para incluir `"cash"`.
- Verificar mapas tipados (`Record<AccountType, ...>`) para evitar llaves faltantes en compilacion.

### 2) Semantica de saldo

- Mantener `isLiabilityAccount` limitado a `credit_card` y `loan`.
- `cash` queda en el mismo grupo de activos que `savings`.

Impacto esperado:

- `normalizeStoredBalance("cash", x)` devuelve `x`.
- `toBalanceFieldValue("cash", x)` devuelve `x`.

### 3) UI de cuentas

En `account-form`:

- Agregar opcion `Efectivo` en el `Select` de tipo.
- Incluir label en `accountTypeLabels`.
- Mantener reglas condicionales actuales de campos financieros:
  - `credit_limit` solo para `credit_card`.
  - `interest_rate`/`due_day` solo para tipos no `savings` (si se requiere ocultarlos para `cash`, se ajusta a regla de cuenta liquida).

En `account-card`:

- Agregar icono, label y acento visual para `cash`.
- Mantener visualizacion de saldo sin bloque de utilizacion (solo aplica a `credit_card`).

### 4) Flujos de movimientos

En `transaction-form`:

- Reemplazar `savingsAccounts` por `liquidAccounts`.
- Definir `originAccounts` y `destinationAccounts` con base en `liquidAccounts` para:
  - `income`
  - `transfer`
  - `payment`
- Actualizar mensaje vacio para reflejar disponibilidad de cuentas liquidas (ahorro o efectivo).

## Manejo de errores y compatibilidad

- Si existe restriccion enum en base de datos para `accounts.type`, agregar `cash` tambien en ese nivel para evitar rechazos al persistir.
- Como no cambia la forma del payload, los hooks existentes no requieren cambios de contrato.

## Verificacion

Pruebas manuales minimas:

1. Crear cuenta tipo `Efectivo` y verificar render correcto en lista/tarjeta.
2. Editar cuenta `Efectivo` y confirmar que conserva tipo y saldo.
3. Registrar `income` seleccionando cuenta `Efectivo`.
4. Registrar `transfer` y `payment` con cuenta `Efectivo` como origen y/o destino (cuando aplica).
5. Confirmar que no se puede seleccionar misma cuenta en origen y destino.
6. Confirmar que saldo de `Efectivo` no se invierte de signo.

## Riesgos

- Si algun reporte/dashboard filtra explicitamente por `savings`, podria excluir `cash` hasta ser ajustado.
- Si hay validaciones backend no tipadas en frontend, el error apareceria solo al guardar.

## Resultado esperado

El sistema soporta cuentas de efectivo como primer ciudadano del dominio: visibles en UI, persistibles, y utilizables en los mismos flujos operativos de cuentas de ahorro sin romper reglas existentes.
