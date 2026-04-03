## Contexto

Se requiere mejorar el formulario de cuentas para resolver tres problemas de UX/datos:

1. Al enviar una cuenta nueva, el formulario no queda limpio de forma consistente.
2. En el dropdown de tipo de cuenta se muestra el valor tecnico del enum en lugar del label legible.
3. Los inputs numericos no tienen mascara/formato visual.

## Objetivos

- Limpiar el formulario correctamente despues de guardar una cuenta nueva.
- Mostrar labels legibles del tipo de cuenta (`Ahorros`, `Tarjeta de Credito`, `Prestamo`) en el select.
- Aplicar formato visual a todos los campos numericos del formulario de cuentas.
- Mantener payload numerico correcto para persistencia.

## Alcance

- Archivo principal: `src/components/accounts/account-form.tsx`.
- No se cambia estructura de base de datos ni tipos de dominio.
- No se modifica logica de hooks de datos, salvo la salida ya existente de `onSubmit`.

## Enfoque seleccionado

Se adopta un enfoque de formateo en vivo + sanitizacion robusta al guardar.

- Estado de campos numericos como `string` para permitir mascara.
- Utilidades locales para:
  - eliminar caracteres no validos,
  - normalizar decimal (`.`/`,`) para tasa,
  - formatear miles para COP.
- Conversion final a `number` unicamente en `handleSubmit`.

Razon: mejor experiencia de captura sin comprometer integridad de datos.

## Diseno tecnico

### 1) Reset/sincronizacion del formulario

- Introducir una funcion `resetForm(data?)` que inicializa todos los estados.
- Usar `useEffect` para sincronizar estados cuando:
  - se abre el modal,
  - cambia `initialData` (editar vs nuevo),
  - se cierra el modal.
- Al submit exitoso:
  - cerrar modal,
  - resetear en modo nuevo para evitar residuos al reabrir.

### 2) Label visible en dropdown de tipo

- Definir `accountTypeLabels: Record<AccountType, string>`.
- En `SelectValue` renderizar explicitamente el label correspondiente al `type` actual.
- Mantener valores internos del `SelectItem` como enums para compatibilidad.

### 3) Mascara/formato para numericos

Campos objetivo:

- `balance`: miles COP.
- `creditLimit`: miles COP.
- `interestRate`: decimal controlado.
- `dueDay`: entero (1-31) con limpieza de no digitos.

Reglas:

- `balance`/`creditLimit`: permitir solo digitos, mostrar separadores de miles.
- `interestRate`: permitir un solo separador decimal y hasta 2 decimales.
- `dueDay`: permitir solo digitos y limitar rango al enviar.

### 4) Serializacion al guardar

- Parsear cada campo con helpers deterministas.
- Reusar `normalizeStoredBalance` para conservar semantica de pasivos.
- Mantener nulabilidad actual:
  - `credit_limit`: solo en `credit_card`.
  - `interest_rate` y `due_day`: no aplican en `savings`.

## Manejo de errores y edge cases

- Entradas vacias se transforman a `0` o `null` segun el campo y tipo de cuenta.
- Cambiar tipo de cuenta limpia campos no aplicables para evitar datos stale.
- Se evita que simbolos de formato (puntos/comas) lleguen al backend como texto.

## Verificacion

Pruebas manuales minimas:

1. Crear cuenta nueva y verificar que al reabrir el modal los campos esten limpios.
2. Editar cuenta existente y validar precarga/formato correcto.
3. Verificar que el trigger del tipo siempre muestre label legible, no enum.
4. Validar captura con formato en todos los numericos y persistencia correcta.
5. Cambiar entre `savings`, `credit_card`, `loan` y confirmar limpieza de campos condicionales.

## Riesgos

- Posibles discrepancias de parseo decimal por locale si no se normaliza consistentemente.
- El formateo en vivo puede mover el cursor en algunos navegadores; se acepta para este alcance.

## Resultado esperado

Formulario de cuentas mas claro, consistente y robusto: inputs limpios tras submit, labels correctos en select y captura numerica formateada sin afectar persistencia.
