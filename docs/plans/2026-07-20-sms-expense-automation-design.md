# SMS Automated Expense Logging Design

## Contexto

El registro manual de gastos en la app es el cuello de botella para adoptar el uso diario. El usuario paga principalmente con Apple Wallet (cuando acredita el débito de la tarjeta) o recibe un SMS del banco con el detalle del movimiento. Cubrir el registro a partir del SMS permite alcanzar ~100% de los gastos ya que todos los bancos notifican via SMS.

Objetivo: semi-automatizar el registro de gastos para reducir la friccion a ~1 tap por transaccion.

## Decisiones confirmadas

- Cobertura: SMS bancarios cubren todos los gastos (incluidos los pagados con Apple Wallet).
- Bancos: Davivienda (ahorros + TC), Davibank/Cencosud (TC Visa Oro), Nequi.
- Nivel de automatizacion: semi-automatico — el sistema predice la categoria/cuenta y el usuario confirma en la app.
- Servicio de IA: Google Gemini 2.0 Flash (free tier: 1500 req/dia).
- Confirmacion/rechazo: se hace manualmente desde la plataforma (no desde el Shortcut). El Shortcut solo envia el SMS y crea el registro pendiente.

## Arquitectura

```
iOS Shortcut (trigger SMS recibido)
       |
       v
POST /api/transactions/sms  { rawSms, sender }
       |
       v
[Next.js API route en Cloudflare Worker]
       |
       v
1. Valida Authorization: Bearer <SHORTCUT_API_KEY>
2. Recupera user_id ( Allowed User Email ) via service role
3. Recupera accounts + expense categories del usuario
4. llama a Gemini API con prompt + contexto
       |
       v
5. Parsea respuesta JSON de Gemini
       |
       v
6. Si ignoreReason = "internal_transfer" -> 200 { ignored: true }
   Si no -> INSERT transaction con status='pending'
       |
       v
Respuesta al Shortcut: { id, amount, merchant, accountName, status }
```

Luego en la app:
- Seccion "Pendientes" arriba de la lista de movimientos.
- Al editar un pending -> status pasa a 'confirmed'.

##upon 

## API

### POST /api/transactions/sms

**Request:**
```json
{
  "rawSms": "DAVIVIENDA: Compra . Aprobado(a), $75,000, Tarjeta *0746, ...",
  "sender": "Davivienda"
}
```

**Headers:**
```
Authorization: Bearer <SHORTCUT_API_KEY>
Content-Type: application/json
```

**Response 200 (transaccion creada):**
```json
{
  "id": "uuid",
  "amount": 75000,
  "merchant": "COMERCIALIZADORA Y DIS",
  "accountName": "Davivienda TC",
  "status": "pending"
}
```

**Response 200 (ignorado):**
```json
{ "ignored": true, "reason": "internal_transfer" }
```

**Response 401:** API key invalida.
**Response 500:** error de parseo o DB.

## Base de datos

```sql
ALTER TABLE transactions
ADD COLUMN status TEXT NOT NULL DEFAULT 'confirmed'
  CHECK (status IN ('confirmed', 'pending'));

CREATE INDEX idx_transactions_status ON transactions(status);
```

## Prompt de Gemini

Se envia el SMS + el listado de cuentas y categorias del usuario. Gemini devuelve JSON estructurado:

```
Estas procesando un SMS bancario colombiano para registrar un movimiento.

Cuentas del usuario:
[ { id, name, type }, ... ]

Categorias de gasto del usuario:
[ { id, name }, ... ]

SMS: "{rawSms}"

Responde SOLO con este JSON, sin explicacion:
{
  "amount": <numero COP sin separadores>,
  "merchant": "<comercio>",
  "accountId": "<UUID o null>",
  "categoryId": "<UUID o null>",
  "type": "expense" | "income" | "transfer",
  "date": "YYYY-MM-DD",
  "description": "<descripcion legible>",
  "ignoreReason": null | "internal_transfer"
}

Reglas:
- Transferencias internas (Bolsillo a Cuenta, entre cuentas propias) -> ignoreReason: "internal_transfer"
- Si no puedes determinar la cuenta, accountId: null
- Si no puedes determinar la categoria, categoryId: null
- Monto en COP, sin decimales, sin separadores de miles
- date: usa la fecha del SMS si esta, si no usa la fecha actual
- type: "income" para abonos/salario, "transfer" para transferencias salientes a terceros, "expense" para compras/pagos
```

## Frontend

### Pagina de transacciones

- Nueva seccion "Pendientes" al inicio de `app-shell page-stack`.
- Se muestra solo si hay transacciones con `status="pending"` en el mes actual.
- Card compacta por cada pendiente:
  - Badge "Por confirmar"
  - Monto + merchant + cuenta predicha
  - Boton "Editar" -> abre el TransactionForm existente prellenado.
- Al guardar el formulario (crear o editar), si la transaccion era pendiente, el backend setea `status='confirmed'`.

### Hook useTransactions

- `updateTransaction` debe poder incluir `status: 'confirmed'` cuando se edita un pending.

## Shortcut de iOS (configuracion manual una vez)

1. Crear Shortcut "Procesar Gasto".
2. Actions:
   - "Get Text from Input" (texto del SMS).
   - "Get Content of URL" con `POST {dominio}/api/transactions/sms`:
     - Headers: `Authorization: Bearer <SHORTCUT_API_KEY>`
     - Body: `{ "rawSms": "<texto>", "sender": "<remitente>" }`
   - "Show Notification" con el resultado.
3. Crear automation triggers (uno por numero de banco):
   - "When message received from <numero banco>" -> "Run Shortcut > Procesar Gasto".

## Variables de entorno

Agregar a `.env.local`:
- `GEMINI_API_KEY` — Google AI Studio API key
- `SUPABASE_SECRET_KEY` — secret key moderna de Supabase (formato `sb_secret_...`, reemplaza al legacy `service_role`)
- `SHORTCUT_API_KEY` — shared secret para autenticar el Shortcut

## Riesgos y mitigaciones

- **Gemini sin free tier suficiente**: Volumen maximo 1500 req/dia. El usuario genera ~5-20 gastos/dia -> dentro del limite. Contingencia: cambiar de modelo en el codigo (1 constante).
- **IA elige cuenta/categoria equivocada**: El flujo semi-automatico permite editarlo en 1 tap.
- **SMS con formato nuevo/no reconocido**: Gemini es robusto a variaciones de formato. Si aun asi falla, la transaccion se crea con campos nulos y el usuario los completa manualmente.
- **API key expuesta en el Shortcut**: El Shortcut vive en el iPhone del usuario. Si se compromete, se puede rotar `SHORTCUT_API_KEY` en .env.local sin tocar la app.

## Verificacion

1. Enviar un SMS de prueba al endpoint via curl/Shortcut -> transaccion se crea con `status='pending'`.
2. Abrir la app -> la transaccion aparece en la seccion "Pendientes".
3. Editar la transaccion -> al guardar, `status` cambia a `'confirmed'` y desaparece de pendientes.
4. Enviar SMS de transferencia interna (Bolsillo a Cuenta) -> respuesta `{ ignored: true }`, no se crea registro.
5. Probar los 6 ejemplos de SMS de Davivienda/Nequi/Davibank -> todos parseados correctamente.