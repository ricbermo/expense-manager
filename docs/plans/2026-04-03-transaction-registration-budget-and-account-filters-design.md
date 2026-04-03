## Contexto

Se requiere ajustar el formulario de registro de movimientos para mejorar consistencia con el uso real de cuentas y presupuestos:

1. En gastos, permitir elegir un budget configurado y usarlo como fuente de categoria.
2. En ingresos, mostrar solo cuentas de ahorro.
3. En transferencias y pagos, permitir solo cuentas de ahorro (origen y destino).

## Objetivos

- Reemplazar seleccion de categoria por seleccion de budget cuando el tipo sea `expense`.
- Cargar budgets segun el mes de la fecha del movimiento.
- Filtrar cuentas por tipo de movimiento:
  - `income`: solo `savings`.
  - `transfer` y `payment`: origen y destino solo `savings`.
- Evitar selecciones invalidas al cambiar tipo o fecha.
- Mantener compatibilidad con el modelo actual de transacciones (sin `budget_id`).

## Decisiones confirmadas

- En `expense`, el selector de budget reemplaza al selector de categoria.
- El filtro de cuentas de ahorro aplica en `income`, `transfer` y `payment`.
- Los budgets visibles en gastos corresponden al mes de la fecha del movimiento.

## Alcance

- Archivo principal: `src/components/transactions/transaction-form.tsx`.
- Soporte de datos: agregar lectura de budgets para poblar el selector.
- No se modifica estructura de base de datos ni tipos de `transactions`.

## Enfoque seleccionado

Se adopta un enfoque local en el formulario (Enfoque A):

- Implementar la logica de filtros y derivacion directamente en `TransactionForm`.
- Para gastos, mapear budget seleccionado a `category_id` al momento de enviar.
- Mantener el payload de `transactions` igual al actual para minimizar riesgo.

Razon: menor superficie de cambio, entrega rapida, bajo riesgo de regresiones.

## Diseno tecnico

### 1) Budget en gastos

- Agregar estado de budget seleccionado para `expense`.
- Consultar budgets del mes derivado de `date` (`YYYY-MM` -> `month = YYYY-MM-01`).
- Mostrar selector de budget solo para `expense`.
- Al enviar gasto:
  - buscar el budget elegido,
  - enviar `category_id = budget.category_id`.

### 2) Filtro de cuentas por tipo

- Definir listas derivadas en memoria:
  - `savingsAccounts`: cuentas con `type === "savings"`.
  - `originAccounts`: segun tipo (`income`, `transfer`, `payment` usan `savingsAccounts`; `expense` usa cuentas disponibles).
  - `destinationAccounts`: para `transfer/payment`, `savingsAccounts` excluyendo `accountId`.
- Aplicar esas listas en los `Select` de cuenta origen/destino.

### 3) Limpieza reactiva de estados

- Si cambia `type` y la cuenta seleccionada deja de ser valida, limpiar `accountId`.
- Si cambia `type` a uno sin destino, limpiar `toAccountId`.
- Si cambia `date` y el budget ya no existe en el nuevo mes, limpiar budget seleccionado.

### 4) Validaciones de submit

- `expense`: requiere `amount`, `accountId`, y budget seleccionado.
- `income`: requiere `amount` y `accountId` (de ahorro).
- `transfer/payment`: requiere `amount`, `accountId`, `toAccountId` y `toAccountId !== accountId`.

## UX y estados vacios

- Si no hay budgets del mes para gasto:
  - mostrar placeholder/estado vacio en selector,
  - bloquear guardado en `expense`.
- Si no hay cuentas de ahorro para `income/transfer/payment`:
  - mostrar selector sin opciones,
  - bloquear guardado.

## Riesgos y mitigacion

- Riesgo: dependencia del catalogo de budgets por mes puede dejar gastos temporalmente bloqueados.
  - Mitigacion: mensaje claro de estado vacio para que el usuario configure budget.
- Riesgo: cambios de tipo/fecha con valores stale.
  - Mitigacion: limpieza reactiva de estados dependientes.

## Verificacion

Pruebas manuales minimas:

1. Crear gasto y elegir budget del mes; guardar correctamente.
2. Cambiar fecha del gasto a otro mes y verificar recarga de budgets.
3. Confirmar que `income` solo muestra cuentas de ahorro.
4. Confirmar que `transfer/payment` solo permiten ahorro en origen/destino y nunca misma cuenta en ambos campos.
5. Verificar bloqueo de guardado cuando faltan budget/cuenta valida segun reglas.

## Resultado esperado

Formulario de movimientos mas alineado al proceso real:

- Gasto enlazado a budget del mes (vía categoria derivada).
- Ingreso, transferencia y pago restringidos a cuentas de ahorro.
- Menos errores de captura por filtros y validaciones contextuales.
