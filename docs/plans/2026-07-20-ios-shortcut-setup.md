# iOS Shortcut setup — SMS expense automation

This document describes the **one-time setup** of the iOS Shortcut that captures
incoming bank SMS messages and posts them to the expense-manager backend.

## Prerequisites

1. The expense manager must be deployed somewhere reachable from your iPhone
   (Cloudflare URL, ngrok for local testing, or your local network IP).
2. The following environment variables must be set on the server:
   - `GEMINI_API_KEY` — Google AI Studio key
   - `SUPABASE_SECRET_KEY` — modern Supabase secret key (format `sb_secret_...`, replaces the legacy `service_role` key). Bypasses RLS.
   - `SHORTCUT_API_KEY` — a shared secret you invent (any long random string)
3. The Supabase migration `20260720_add_status_to_transactions.sql` must be
   applied so the `transactions.status` column exists.

## 1) Create the Shortcut

Open the **Shortcuts** app on your iPhone and create a new shortcut named
"Procesar Gasto SMS".

Add the following actions in order:

### Action 1 — Receive input from automation
The shortcut will receive the SMS message as input when triggered by an
automation. Add a **"Get Text from Input"** action (or use the `ShortcutInput`
variable that iOS provides automatically).

### Action 2 — Get content of URL (POST to backend)

Add a **"Get Contents of URL"** action. Configure it:

- **URL:** `https://YOUR-DOMAIN/api/transactions/sms`
- **Method:** `POST`
- **Headers:**
  - `Authorization` = `Bearer YOUR_SHORTCUT_API_KEY`
  - `Content-Type` = `application/json`
- **Request Body (JSON):**
  ```json
  {
    "rawSms": "<tap and insert the SMS text variable here>",
    "sender": ""
  }
  ```

For `rawSms`, tap the value field and choose the variable from Action 1 (the
SMS text). El campo `sender` se deja vacío — Gemini identifica el banco
automáticamente desde el contenido del SMS.

### Action 3 — Show notification with the result

Add a **"Show Notification"** action:

- **Title:** `Gasto registrado`
- **Body:** tap and insert the response from Action 2. You can format it as:
  - `$<amount>` — `<merchant>` (pendiente)
  - or just dump the raw JSON response.

### Action 4 (optional) — Vibrate / play sound

Add a "Vibrate Device" or "Play Sound" action to give you haptic feedback that
the webhook completed.

## 2) Create automations by keyword (not by sender number)

Los bancos colombianos usan **códigos cortos** (ej: `980123`) como remitentes
SMS. iOS Shortcuts formatea automáticamente estos números (ej: `980-123`), y
la automatización nunca se dispara porque el sender real no coincide.

En vez de filtrar por número de remitente, crea una o más automatizaciones
que se disparen por **palabras clave** en el contenido del SMS:

1. Abre **Shortcuts** → **Automation** → **+ New Automation**.
2. Elige **Message** como trigger.
3. Configura:
   - **Sender:** dejar vacío
   - **Message contains:** ingresar una palabra clave
   - **Run Immediately:** sí
4. Action: **Run Shortcut** → seleccionar "Procesar Gasto SMS".
5. Tap **Done**.

Repite para cada palabra clave que quieras cubrir. Recomendado:
- `compra` — captura la mayoría de gastos (tarjeta débito/crédito, PSE, datafono)
- `abono` — captura ingresos y depósitos
- `retiro` — captura retiros de cajero

Con estas 3 automatizaciones cubres ~95 % de los SMS bancarios sin depender
del número de remitente.

## 3) End-to-end test

1. Send yourself a real SMS from one of your banks (or wait for a real
   transaction).
2. The shortcut should fire automatically.
3. You should see the notification "Gasto registrado".
4. Open the expense manager, go to **Movimientos**.
5. A **"Pendientes por confirmar"** section appears at the top with the new
   transaction.
6. Tap the pencil icon → adjust category/account if needed → **Save**.
7. The transaction moves from "pending" to "confirmed" and disappears from
   the pending section.

## Troubleshooting

- **La automatización nunca se dispara:** iOS Shortcuts formatea los códigos
  cortos de los bancos (ej: `980123` → `980-123`). Solución: usa el trigger
  por **Message contains** con palabras clave como `compra`, `abono` o `retiro`
  (ver sección 2).
- **401 Unauthorized:** Check that `Authorization: Bearer <key>` matches
  `SHORTCUT_API_KEY` on the server exactly.
- **500 Missing env vars:** The server is missing one of
  `GEMINI_API_KEY`, `SUPABASE_SECRET_KEY`, or `SHORTCUT_API_KEY`.
- **502 Gemini parse failed:** Gemini API rejected the request. Verify your
  API key is valid and you have free-tier quota.
- **422 Could not determine amount:** The SMS format wasn't recognized.
  Check `/api/transactions/sms` logs in Cloudflare; the `parsed` field in
  the response shows what Gemini returned.
- **Ignored (internal_transfer):** Expected behavior for SMS about internal
  movements (e.g., "Bolsillo a Cuenta"). No transaction is created.

## Rotating the shortcut key

If `SHORTCUT_API_KEY` is ever compromised:

1. Generate a new random string.
2. Update `.env.local` (and Cloudflare secret) on the server.
3. Re-deploy.
4. Update the `Authorization` header in the iOS Shortcut.

No app changes needed.