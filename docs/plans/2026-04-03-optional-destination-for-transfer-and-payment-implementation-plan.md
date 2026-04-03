# Optional Destination for Transfer and Payment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow `transfer` and `payment` transactions to be saved without internal destination account, treating those cases as outgoing movements to third parties.

**Architecture:** Keep the UI change localized to the transaction form and make destination validation explicit through a reusable helper with unit tests. Update account-balance trigger logic in SQL so `transfer/payment` always subtract from origin and only add to destination when `to_account_id` is present, then ship a migration for existing databases.

**Tech Stack:** Next.js 16 App Router, React 19 client components, TypeScript, Supabase Postgres SQL triggers, Node test runner (`node:test`).

---

### Task 1: Add failing tests for destination rules helper

**Files:**
- Create: `tests/transaction-destination-rules.test.mjs`
- Create: `src/lib/utils/transaction-destination-rules.ts`

**Step 1: Write failing tests for destination validity rules**

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  isDestinationSelectionValid,
  isDestinationRequired,
} from "../src/lib/utils/transaction-destination-rules.ts";

test("transfer and payment do not require destination", () => {
  assert.equal(isDestinationRequired("transfer"), false);
  assert.equal(isDestinationRequired("payment"), false);
});

test("expense and income ignore destination validation", () => {
  assert.equal(isDestinationSelectionValid("expense", "a", ""), true);
  assert.equal(isDestinationSelectionValid("income", "a", "a"), true);
});

test("transfer/payment allow empty destination", () => {
  assert.equal(isDestinationSelectionValid("transfer", "a", ""), true);
  assert.equal(isDestinationSelectionValid("payment", "a", ""), true);
});

test("transfer/payment reject same origin and destination", () => {
  assert.equal(isDestinationSelectionValid("transfer", "a", "a"), false);
  assert.equal(isDestinationSelectionValid("payment", "a", "a"), false);
});

test("transfer/payment allow different destination", () => {
  assert.equal(isDestinationSelectionValid("transfer", "a", "b"), true);
  assert.equal(isDestinationSelectionValid("payment", "a", "b"), true);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/transaction-destination-rules.test.mjs`
Expected: FAIL with module/function not found.

**Step 3: Commit Task 1 test scaffold**

```bash
git add tests/transaction-destination-rules.test.mjs src/lib/utils/transaction-destination-rules.ts
git commit -m "test: add failing coverage for optional destination rules"
```

### Task 2: Implement destination rules helper and make tests pass

**Files:**
- Modify: `src/lib/utils/transaction-destination-rules.ts`
- Modify: `tests/transaction-destination-rules.test.mjs`

**Step 1: Implement minimal helper logic**

```ts
import type { TransactionType } from "@/lib/types/database";

export function isDestinationRequired(type: TransactionType): boolean {
  return false;
}

export function isDestinationSelectionValid(
  type: TransactionType,
  accountId: string,
  toAccountId: string
): boolean {
  if (type !== "transfer" && type !== "payment") {
    return true;
  }

  if (!toAccountId) {
    return true;
  }

  return toAccountId !== accountId;
}
```

**Step 2: Run focused tests**

Run: `node --test tests/transaction-destination-rules.test.mjs`
Expected: PASS.

**Step 3: Run full local test suite**

Run: `node --test tests/*.test.mjs`
Expected: PASS on existing tests and the new rules test.

**Step 4: Commit Task 2**

```bash
git add src/lib/utils/transaction-destination-rules.ts tests/transaction-destination-rules.test.mjs
git commit -m "feat: add destination validation rules for transfers and payments"
```

### Task 3: Wire optional destination behavior into transaction form

**Files:**
- Modify: `src/components/transactions/transaction-form.tsx`
- Modify: `src/lib/utils/transaction-destination-rules.ts` (only if small helper naming tweaks are needed)

**Step 1: Replace inline destination validation with helper**

```ts
import { isDestinationSelectionValid } from "@/lib/utils/transaction-destination-rules";

const hasValidDestination = isDestinationSelectionValid(type, accountId, toAccountId);
```

**Step 2: Keep submit payload nullable for destination**

```ts
to_account_id:
  type === "transfer" || type === "payment"
    ? toAccountId || null
    : null,
```

**Step 3: Update destination UI copy to optional**

```tsx
<Label htmlFor="toAccount">Cuenta destino (opcional)</Label>
<SelectValue placeholder="Selecciona cuenta destino o dejalo vacio" />
```

**Step 4: Run lint**

Run: `npm run lint`
Expected: command exits with code 0 and no new lint errors.

**Step 5: Commit Task 3**

```bash
git add src/components/transactions/transaction-form.tsx src/lib/utils/transaction-destination-rules.ts
git commit -m "feat: allow transfer and payment without destination account"
```

### Task 4: Update SQL trigger logic and migration for existing DBs

**Files:**
- Modify: `supabase/schema.sql`
- Create: `supabase/migrations/20260403_optional_destination_for_transfer_payment.sql`

**Step 1: Write failing SQL expectation comments in migration file**

```sql
-- Expected behavior after migration:
-- 1) transfer/payment always subtract from account_id
-- 2) transfer/payment add to to_account_id only when not null
-- 3) delete operation reverts symmetrically
```

**Step 2: Implement function replacement in migration**

```sql
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'expense' THEN
      UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'income' THEN
      UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type IN ('transfer', 'payment') THEN
      UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
      IF NEW.to_account_id IS NOT NULL THEN
        UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.to_account_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'expense' THEN
      UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'income' THEN
      UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type IN ('transfer', 'payment') THEN
      UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
      IF OLD.to_account_id IS NOT NULL THEN
        UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.to_account_id;
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

**Step 3: Mirror same logic in `supabase/schema.sql`**

Use the same conditional `IF NEW.to_account_id IS NOT NULL` and `IF OLD.to_account_id IS NOT NULL` blocks in the canonical schema function.

**Step 4: Validate SQL changes locally**

Run: `npm run lint`
Expected: PASS (sanity check for workspace after file updates).

**Step 5: Commit Task 4**

```bash
git add supabase/schema.sql supabase/migrations/20260403_optional_destination_for_transfer_payment.sql
git commit -m "fix: handle transfer and payment without destination account in balance trigger"
```

### Task 5: Final verification and manual QA

**Files:**
- Modify: none

**Step 1: Run tests and lint together**

Run: `node --test tests/*.test.mjs && npm run lint`
Expected: PASS.

**Step 2: Manual UI verification in dev server**

Run: `npm run dev`
Expected: app starts and transaction form allows optional destination for `transfer/payment`.

Manual checks:
- Create `transfer` with destination account: origin decreases, destination increases.
- Create `transfer` without destination: origin decreases only.
- Create `payment` with destination account: origin decreases, destination increases.
- Create `payment` without destination: origin decreases only.
- Try same origin+destination and verify save stays blocked.

**Step 3: Commit Task 5 (if any fixes applied during verification)**

```bash
git add <files-changed-during-verification>
git commit -m "test: verify optional destination transaction flow"
```
