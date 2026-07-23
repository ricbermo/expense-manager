# Accounts Reconciliation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make credit-card reconciliation accurate for partial payments while making upcoming obligations the primary Accounts signal.

**Architecture:** Add a statement-payment ledger and an atomic Supabase RPC for payment transfer creation. Keep payment-state math and accounts ordering in pure TypeScript helpers so the page, hook, and tests share one definition of outstanding debt. Recompose the existing accounts cards and forms around the nearest open statement without introducing new UI primitives.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Supabase Postgres/RPC, SWR, react-hook-form, Tailwind CSS, Node test runner.

---

### Task 1: Model statement payment state

**Files:**
- Create: `src/lib/utils/credit-card-statements.ts`
- Create: `tests/credit-card-statements.test.mjs`

**Step 1: Write the failing test**

Cover an unpaid statement with zero payments, a partially paid statement, a fully paid statement, nearest-due ordering, and duplicate transaction IDs.

**Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test tests/credit-card-statements.test.mjs`

Expected: failure because `credit-card-statements.ts` does not exist.

**Step 3: Write minimal implementation**

Export pure helpers that derive paid amount, remaining balance, open/paid state, and ordering from statement/payment inputs.

**Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test tests/credit-card-statements.test.mjs`

Expected: all focused assertions pass.

### Task 2: Add atomic persistence

**Files:**
- Create: `supabase/migrations/20260722_add_credit_card_statement_payments.sql`
- Modify: `src/lib/types/database.ts`
- Modify: `src/lib/hooks/use-credit-card-statements.ts`

**Step 1: Write the failing test**

Extend the helper test with the model expected from an atomic payment record: a statement does not become paid until cumulative payments cover its total.

**Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test tests/credit-card-statements.test.mjs`

Expected: remaining balance/paid-state assertion fails.

**Step 3: Write minimal implementation**

Create an RLS-protected ledger table with unique transaction references and a security-invoker RPC that inserts the transfer and payment record in one transaction. Return payment and statement state. Extend client types and fetch statements with nested payment rows. Replace the unconditional `markAsPaid` mutation with an RPC-backed payment function.

**Step 4: Run focused verification**

Run: `node --experimental-strip-types --test tests/credit-card-statements.test.mjs`

Expected: all focused assertions pass.

### Task 3: Validate financial inputs

**Files:**
- Modify: `src/components/accounts/credit-card-statement-form.tsx`
- Modify: `src/components/accounts/credit-card-payment-form.tsx`
- Modify: `src/lib/utils/credit-card-statements.ts`
- Modify: `tests/credit-card-statements.test.mjs`

**Step 1: Write failing tests**

Add pure validation cases for zero/negative amounts, minimum greater than total, due date before statement date, source funds below payment, and payment greater than statement remainder.

**Step 2: Run test to verify failures**

Run: `node --experimental-strip-types --test tests/credit-card-statements.test.mjs`

Expected: validation exports are missing or assertions fail.

**Step 3: Implement minimal validation**

Expose validation helpers. Wire them to `react-hook-form` field validation and render `aria-live` inline messages. State remaining balance in the payment form and keep values on server failure.

**Step 4: Run focused verification**

Run: `node --experimental-strip-types --test tests/credit-card-statements.test.mjs`

Expected: all validation assertions pass.

### Task 4: Recompose the Accounts hierarchy

**Files:**
- Modify: `src/app/accounts/page.tsx`
- Modify: `src/components/accounts/account-card.tsx`
- Modify: `src/lib/utils/credit-card-statements.ts`
- Modify: `tests/credit-card-statements.test.mjs`

**Step 1: Write failing tests**

Add ordering and summary tests: open statements sort by due date; accounts with an upcoming payment sort before ordinary accounts; total outstanding spans all open statements.

**Step 2: Run test to verify failures**

Run: `node --experimental-strip-types --test tests/credit-card-statements.test.mjs`

Expected: ordering and summary assertions fail.

**Step 3: Implement minimal presentation changes**

Render a due-first summary, independently labeled funds/debt/net figures, and cards ordered by required action. Show the nearest statement and a concise all-open-statements summary. Make only the relevant statement action primary; use an accessible overflow menu for edit/delete.

**Step 4: Run focused verification**

Run: `node --experimental-strip-types --test tests/credit-card-statements.test.mjs`

Expected: all hierarchy assertions pass.

### Task 5: Mobile and copy pass

**Files:**
- Modify: `src/app/accounts/page.tsx`
- Modify: `src/components/accounts/account-card.tsx`
- Modify: `src/components/accounts/account-form.tsx`

**Step 1: Apply existing system tokens**

Use existing buttons/cards with at least 44px interactive targets on primary mobile actions. Correct visible Spanish accents and make payment labels explicit.

**Step 2: Run static verification**

Run: `npm run lint`

Expected: exit 0.

### Task 6: Full verification

**Files:**
- Verify only

**Step 1: Run all tests**

Run: `node --experimental-strip-types --test tests/*.test.mjs`

Expected: all tests pass.

**Step 2: Run production build**

Run: `npm run build`

Expected: exit 0.

**Step 3: Inspect changes**

Run: `git diff --check` and `git diff --stat`

Expected: no whitespace errors and only intended Accounts files plus the migration, tests, and plan documents.
