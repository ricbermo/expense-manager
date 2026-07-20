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
    "sender": "Davivienda"
  }
  ```

For `rawSms`, tap the value field and choose the variable from Action 1 (the
SMS text). For `sender`, hardcode the bank name per shortcut (or use a magic
variable from the automation trigger).

### Action 3 — Show notification with the result

Add a **"Show Notification"** action:

- **Title:** `Gasto registrado`
- **Body:** tap and insert the response from Action 2. You can format it as:
  - `$<amount>` — `<merchant>` (pendiente)
  - or just dump the raw JSON response.

### Action 4 (optional) — Vibrate / play sound

Add a "Vibrate Device" or "Play Sound" action to give you haptic feedback that
the webhook completed.

## 2) Create one automation per bank number

For each bank's sender number (Davivienda SMS sender, Nequi SMS sender,
Davibank SMS sender, etc.) create an **Automation**:

1. Open the **Shortcuts** app → **Automation** tab → **+ New Automation**.
2. Choose **Message** as the trigger.
3. Configure:
   - **Sender:** add the bank's SMS phone number
   - **Message contains:** leave empty (matches all messages)
   - **Run Immediately:** yes (this skips the "Ask Before Running" prompt)
4. Action: **Run Shortcut** → select "Procesar Gasto SMS".
5. Optionally pass the bank name as input for the `sender` field.

Repeat for each bank number. Each automation takes ~3 minutes and only needs
to be created once.

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