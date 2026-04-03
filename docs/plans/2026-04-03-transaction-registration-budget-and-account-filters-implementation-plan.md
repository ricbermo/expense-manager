# Transaction Registration Budget and Account Filters Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update transaction registration so expenses select a budget (month-aware), and income/transfer/payment only use savings accounts.

**Architecture:** Keep changes localized to the transaction form UI and payload assembly. Load monthly budgets directly in the form based on selected date, derive `category_id` from selected budget for expenses, and filter account options per transaction type before submit. Do not change database schema.

**Tech Stack:** Next.js 16 (App Router), React 19 client components, TypeScript, Supabase JS client, shadcn/ui Select/Dialog controls.

---

### Task 1: Add month-aware budget loading in transaction form

**Files:**
- Modify: `src/components/transactions/transaction-form.tsx`

**Step 1: Add local budget relation type and Supabase client import**

```ts
import { createClient } from "@/lib/supabase/client";
import type {
  Account,
  Budget,
  Category,
  Transaction,
  TransactionType,
} from "@/lib/types/database";

type BudgetWithCategory = Budget & { categories: Category | null };
```

**Step 2: Add state for selected budget and loaded budget options**

```ts
const [budgetId, setBudgetId] = useState("");
const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
const [loadingBudgets, setLoadingBudgets] = useState(false);
```

**Step 3: Add helper for month key from selected date**

```ts
const selectedMonth = `${date.slice(0, 7)}-01`;
```

**Step 4: Add effect to fetch budgets for selected month**

```ts
useEffect(() => {
  let isCancelled = false;

  const fetchBudgets = async () => {
    setLoadingBudgets(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("budgets")
      .select("*, categories(*)")
      .eq("month", selectedMonth);

    if (!isCancelled) {
      setBudgets((data as BudgetWithCategory[]) ?? []);
      setLoadingBudgets(false);
    }
  };

  fetchBudgets();
  return () => {
    isCancelled = true;
  };
}, [selectedMonth]);
```

**Step 5: Commit Task 1**

```bash
git add src/components/transactions/transaction-form.tsx
git commit -m "feat: load budgets by transaction month in form"
```

### Task 2: Replace expense category selection with budget selection

**Files:**
- Modify: `src/components/transactions/transaction-form.tsx`

**Step 1: Keep income category hook, but split UI by type**

```ts
const { categories } = useCategories(type === "income" ? "income" : undefined);

// Render category selector only for income.
// Render budget selector only for expense.
```

**Step 2: Render budget selector only when type is expense**

```tsx
{type === "expense" && (
  <div className="space-y-2">
    <Label htmlFor="budget">Budget</Label>
    <Select value={budgetId} onValueChange={(v) => setBudgetId(v ?? "")}> 
      <SelectTrigger id="budget">
        <SelectValue placeholder="Selecciona budget" />
      </SelectTrigger>
      <SelectContent>
        {budgets.map((b) => (
          <SelectItem key={b.id} value={b.id}>
            {b.categories?.name ?? "Sin categoria"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    {type === "expense" && !loadingBudgets && budgets.length === 0 && (
      <p className="text-xs text-muted-foreground">No hay budgets para este mes</p>
    )}
  </div>
)}
```

**Step 3: Derive category_id from selected budget on submit for expenses**

```ts
const selectedBudget = budgets.find((b) => b.id === budgetId);

await onSubmit({
  type,
  amount: parseIntegerInput(amount),
  description: description || null,
  date,
  category_id: type === "expense" ? selectedBudget?.category_id ?? null : type === "income" ? categoryId || null : null,
  account_id: accountId,
  to_account_id: type === "transfer" || type === "payment" ? toAccountId || null : null,
});
```

**Step 4: Clear budget selection after successful submit**

```ts
setBudgetId("");
```

**Step 5: Commit Task 2**

```bash
git add src/components/transactions/transaction-form.tsx
git commit -m "feat: select budget for expense transactions"
```

### Task 3: Filter account options for income, transfer, and payment

**Files:**
- Modify: `src/components/transactions/transaction-form.tsx`

**Step 1: Add derived account lists**

```ts
const savingsAccounts = accounts.filter((a) => a.type === "savings");

const originAccounts =
  type === "income" || type === "transfer" || type === "payment"
    ? savingsAccounts
    : accounts;

const destinationAccounts = savingsAccounts.filter((a) => a.id !== accountId);
```

**Step 2: Use `originAccounts` in account origin selector**

```tsx
{originAccounts.map((a) => (
  <SelectItem key={a.id} value={a.id}>
    {a.name}
  </SelectItem>
))}
```

**Step 3: Use `destinationAccounts` in destination selector for transfer/payment**

```tsx
{destinationAccounts.map((a) => (
  <SelectItem key={a.id} value={a.id}>
    {a.name}
  </SelectItem>
))}
```

**Step 4: Add reactive cleanup when selections become invalid**

```ts
useEffect(() => {
  if (accountId && !originAccounts.some((a) => a.id === accountId)) {
    setAccountId("");
  }
}, [accountId, originAccounts]);

useEffect(() => {
  if (toAccountId && !destinationAccounts.some((a) => a.id === toAccountId)) {
    setToAccountId("");
  }
}, [toAccountId, destinationAccounts]);
```

**Step 5: Commit Task 3**

```bash
git add src/components/transactions/transaction-form.tsx
git commit -m "feat: restrict income and transfers to savings accounts"
```

### Task 4: Enforce submit guards and empty-state behavior

**Files:**
- Modify: `src/components/transactions/transaction-form.tsx`

**Step 1: Add derived booleans for can-save rules**

```ts
const needsDestination = type === "transfer" || type === "payment";
const requiresBudget = type === "expense";

const hasValidBudget = !requiresBudget || !!budgets.find((b) => b.id === budgetId);
const hasValidOrigin = !!accountId;
const hasValidDestination = !needsDestination || (!!toAccountId && toAccountId !== accountId);

const canSave = !saving && !!amount && hasValidOrigin && hasValidDestination && hasValidBudget;
```

**Step 2: Use `canSave` in submit button**

```tsx
<Button type="submit" className="w-full" disabled={!canSave}>
  {saving ? "Guardando..." : "Guardar"}
</Button>
```

**Step 3: Add invalid-state hints for missing budget/savings accounts**

```tsx
{type === "income" && savingsAccounts.length === 0 && (
  <p className="text-xs text-muted-foreground">No hay cuentas de ahorro disponibles</p>
)}
```

**Step 4: Run lint before final commit**

Run: `npm run lint`
Expected: command exits with code 0 and no new lint errors.

**Step 5: Commit Task 4**

```bash
git add src/components/transactions/transaction-form.tsx
git commit -m "fix: enforce budget and account rules in transaction form"
```

### Task 5: Verify end-to-end behavior manually

**Files:**
- Modify: none

**Step 1: Start app locally**

Run: `npm run dev`
Expected: Next.js dev server starts successfully.

**Step 2: Validate expense flow**

Manual checks:
- Set movement type to `Gasto`.
- Confirm budget selector appears.
- Change date month and confirm budget options update.
- Confirm save stays disabled when no budget is available/selected.

**Step 3: Validate income flow**

Manual checks:
- Set movement type to `Ingreso`.
- Confirm origin account list contains only savings accounts.

**Step 4: Validate transfer and payment flows**

Manual checks:
- Set movement type to `Transferencia` and `Pago`.
- Confirm origin and destination show only savings accounts.
- Confirm destination cannot match origin.

**Step 5: Final verification + single integration commit**

Run: `npm run lint && npm run build`
Expected: both commands pass.

```bash
git add src/components/transactions/transaction-form.tsx docs/plans/2026-04-03-transaction-registration-budget-and-account-filters-design.md docs/plans/2026-04-03-transaction-registration-budget-and-account-filters-implementation-plan.md
git commit -m "feat: align transaction registration with budgets and savings-only account rules"
```

## Notes for execution

- Prefer @superpowers:test-driven-development discipline where practical, but avoid introducing new test framework scope for this incremental UI rule change.
- Before declaring done, run @superpowers:verification-before-completion.
- If implementing in this session, use @superpowers:subagent-driven-development.
