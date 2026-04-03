## Contexto

En el formulario de movimientos, los tipos `transfer` y `payment` actualmente exigen `Cuenta destino`.
En el uso real, existen casos donde el dinero sale de una cuenta interna hacia un tercero (persona, comercio, servicio) y no debe entrar a otra cuenta del sistema.

## Objetivos

- Permitir que `transfer` y `payment` se registren sin `Cuenta destino`.
- Mantener el flujo actual cuando si existe cuenta destino interna.
- Hacer explicita la logica de balance para evitar depender de efectos implicitos con `NULL`.
- Evitar cambios de esquema innecesarios y usar `Descripcion` para registrar el destinatario externo.

## Decisiones confirmadas

- Si no hay `Cuenta destino`, el movimiento solo resta en `Cuenta origen`.
- No se agrega campo nuevo para destinatario externo; se usa `Descripcion`.
- Si hay `Cuenta destino`, debe ser distinta de `Cuenta origen`.

## Alcance

- UI/formulario: `src/components/transactions/transaction-form.tsx`.
- Logica contable en base de datos: funcion `update_account_balance` en `supabase/schema.sql`.
- Migracion de compatibilidad para entornos existentes: `supabase/migrations/`.
- No se modifica la estructura de la tabla `transactions`.

## Enfoque seleccionado

Se adopta un enfoque combinado UI + DB:

- En UI, `Cuenta destino` pasa a ser opcional para `transfer/payment`.
- En DB, la funcion de balance se ajusta para tratar explicitamente `to_account_id IS NULL`.
- Se mantiene la validacion de origen/destino distintos cuando destino existe.

Razon: permite cubrir el caso de transferencias/pagos a terceros sin romper el flujo interno entre cuentas ni dejar comportamiento ambiguo en la base de datos.

## Diseno tecnico

### 1) Cambios en formulario (`transaction-form`)

- Mantener `to_account_id` como `toAccountId || null` en submit.
- Ajustar validacion de destino:
  - valido si `toAccountId` esta vacio (caso tercero),
  - valido si existe y es distinto de `accountId`,
  - invalido solo si ambos son iguales.
- Mostrar `Cuenta destino` como opcional para `transfer/payment`.
- Mantener limpieza reactiva de `toAccountId` cuando cambie tipo o la opcion quede invalida.

### 2) Cambios en logica de balances (trigger)

En `update_account_balance`:

- `INSERT` para `transfer/payment`:
  - siempre restar de `NEW.account_id`,
  - sumar a `NEW.to_account_id` solo cuando no sea `NULL`.
- `DELETE` para `transfer/payment`:
  - siempre sumar a `OLD.account_id` (reversion),
  - restar de `OLD.to_account_id` solo cuando no sea `NULL`.

Esto hace el comportamiento explicito para movimientos internos y hacia terceros.

### 3) Migracion para entornos existentes

- Crear migracion SQL que reemplace la funcion `update_account_balance` con la logica nueva.
- El archivo `schema.sql` queda alineado para nuevos entornos.

## UX y validaciones

- En `transfer/payment`, `Cuenta destino` no bloquea guardado si esta vacia.
- Cuando se informa destino, se bloquea guardado si coincide con origen.
- `Descripcion` se mantiene como campo recomendado para registrar el destinatario externo.

## Riesgos y mitigacion

- Riesgo: diferencia de comportamiento entre entornos nuevos y ya desplegados.
  - Mitigacion: migracion dedicada para actualizar la funcion en bases existentes.
- Riesgo: confusion del usuario sobre destino opcional.
  - Mitigacion: etiqueta/placeholder claro indicando que es opcional.

## Verificacion

Pruebas manuales minimas:

1. `transfer` con destino interno: resta origen y suma destino.
2. `transfer` sin destino: solo resta origen.
3. `payment` con destino interno: resta origen y suma destino.
4. `payment` sin destino: solo resta origen.
5. Eliminar cada uno de los casos anteriores revierte balances de forma simetrica.
6. Si origen y destino son iguales (cuando destino existe), el formulario bloquea guardado.

## Resultado esperado

Registro de transferencias y pagos alineado con casos reales:

- Se soportan movimientos a terceros sin cuenta interna destino.
- Se conserva el flujo interno entre cuentas cuando aplica.
- Las reglas de balance quedan explicitas, predecibles y mantenibles.
