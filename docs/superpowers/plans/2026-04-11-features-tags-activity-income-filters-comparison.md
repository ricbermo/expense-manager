# Features Plan: Tags, Account Activity, Income View, Advanced Filters, Month Comparison

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 UX improvements to the expense manager: transaction tags, per-account monthly activity, income category breakdown on the dashboard, advanced transaction filters, and a 6-month income/expense comparison chart.

**Architecture:** Tags require one DB migration and propagate through the existing type→hook→form→list chain. Account activity and monthly comparison each add one SWR hook and one component. Income view extends `useDashboard` and adds one component. Advanced filters extend the existing client-side `useMemo` in the transactions page with no new files.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase (PostgreSQL), SWR, Recharts, React Hook Form, Tailwind CSS 4, shadcn/ui, Lucide icons

---

## File Map

**New files:**
- `supabase/migrations/20260411_add_tags_to_transactions.sql`
- `src/lib/hooks/use-account-activity.ts`
- `src/components/dashboard/income-by-category.tsx`
- `src/lib/hooks/use-monthly-comparison.ts`
- `src/components/dashboard/monthly-comparison.tsx`

**Modified files:**
- `src/lib/types/database.ts` — add `tags: string[]` to `Transaction`
- `src/lib/swr/keys.ts` — add `accountActivity` and `monthlyComparison` keys
- `src/components/transactions/transaction-form.tsx` — add tags text input, parse on submit
- `src/components/transactions/transaction-list.tsx` — render tags as Badge elements
- `src/app/transactions/page.tsx` — add account + amount range filters
- `src/components/accounts/account-card.tsx` — add optional `activity` prop
- `src/app/accounts/page.tsx` — add month state, call activity hook, pass to cards
- `src/lib/hooks/use-dashboard.ts` — add `incomeByCategory` to `DashboardData`
- `src/app/page.tsx` — render `<IncomeByCategory>` and `<MonthlyComparison>`

---

## Feature A — Transaction Tags

### Task A1: DB migration

**Files:**
- Create: `supabase/migrations/20260411_add_tags_to_transactions.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260411_add_tags_to_transactions.sql
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
```

- [ ] **Step 2: Apply the migration**

Option A (Supabase CLI): run `npx supabase db push` from the project root.
Option B (Studio): open the Supabase dashboard → SQL editor → paste and run.

Expected result: `transactions` table has a `tags` column visible in Studio.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260411_add_tags_to_transactions.sql
git commit -m "feat: add tags column to transactions"
```

---

### Task A2: Update Transaction type

**Files:**
- Modify: `src/lib/types/database.ts`

- [ ] **Step 1: Add `tags` to the Transaction interface**

Find the `Transaction` interface (line 25) and add the field after `related_expense_id`:

```ts
export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  date: string;
  category_id: string | null;
  budget_id: string | null;
  related_expense_id: string | null;
  account_id: string;
  to_account_id: string | null;
  tags: string[];
  created_at: string;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to `tags`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types/database.ts
git commit -m "feat: add tags field to Transaction type"
```

---

### Task A3: Add tags field to TransactionForm

**Files:**
- Modify: `src/components/transactions/transaction-form.tsx`

Context: The form uses `TransactionFormValues` for internal state and converts to `Transaction` on submit. Tags are stored as `string[]` in the DB but handled as a comma-separated `string` in the form for simplicity.

- [ ] **Step 1: Add `tags` to `TransactionFormValues` (line 69)**

Find the `interface TransactionFormValues` block and add `tags: string`:

```ts
interface TransactionFormValues {
  type: TransactionType;
  amount: string;
  description: string;
  date: string;
  categoryId: string;
  budgetId: string;
  accountId: string;
  toAccountId: string;
  isDebtPayment: boolean;
  isSharedExpense: boolean;
  splitBetween: number;
  tags: string;
}
```

- [ ] **Step 2: Update `getDefaultValues` to include `tags` (line 83)**

In `getDefaultValues`, add `tags` to both the empty-form branch and the edit branch:

```ts
function getDefaultValues(
  editTransaction?: (Transaction & { categories?: Category | null }) | null
): TransactionFormValues {
  if (!editTransaction) {
    return {
      type: "expense",
      amount: "",
      description: "",
      date: getTodayLocalDate(),
      categoryId: "",
      budgetId: "",
      accountId: "",
      toAccountId: "",
      isDebtPayment: false,
      isSharedExpense: false,
      splitBetween: 2,
      tags: "",
    };
  }

  return {
    type: editTransaction.type,
    amount: formatIntegerInput(String(editTransaction.amount)),
    description: editTransaction.description ?? "",
    date: editTransaction.date,
    categoryId: editTransaction.category_id ?? "",
    budgetId: editTransaction.budget_id ?? "",
    accountId: editTransaction.account_id,
    toAccountId: editTransaction.to_account_id ?? "",
    isDebtPayment:
      editTransaction.type === "expense" && !!editTransaction.to_account_id,
    isSharedExpense: false,
    splitBetween: 2,
    tags: (editTransaction.tags ?? []).join(", "),
  };
}
```

- [ ] **Step 3: Include `tags` in the submit payload inside `onFormSubmit` (around line 354)**

Add `tags` to the `transaction` object:

```ts
const transaction = {
  type: values.type,
  amount: parseIntegerInput(values.amount),
  description: values.description || null,
  date: values.date,
  budget_id: values.type === "expense" ? values.budgetId || null : null,
  category_id:
    values.type === "expense"
      ? selectedBudget?.category_id ?? null
      : values.type === "income"
        ? values.categoryId || null
        : null,
  account_id: values.accountId,
  related_expense_id: isEditing ? (editTransaction?.related_expense_id ?? null) : null,
  to_account_id:
    values.type === "transfer" || values.type === "expense"
      ? values.toAccountId || null
      : null,
  tags: values.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean),
};
```

- [ ] **Step 4: Add the tags input field in the JSX, after the description field (before the submit button)**

```tsx
<div className="space-y-2">
  <Label htmlFor="tags">Etiquetas (opcional)</Label>
  <Input
    id="tags"
    {...register("tags")}
    placeholder="Ej: trabajo, ocio, fijo"
  />
  <p className="text-xs text-muted-foreground">Separa con comas</p>
</div>
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/transactions/transaction-form.tsx
git commit -m "feat: add tags input to transaction form"
```

---

### Task A4: Display tags in TransactionList

**Files:**
- Modify: `src/components/transactions/transaction-list.tsx`

- [ ] **Step 1: Add the Badge import at the top of the file**

```ts
import { Badge } from "@/components/ui/badge";
```

- [ ] **Step 2: Render tags below the meta line (inside the `<div className="flex-1 min-w-0">` block)**

Replace the current inner div content:

```tsx
<div className="flex-1 min-w-0">
  <p className="text-sm font-medium truncate">
    {t.description || t.categories?.name || t.type}
  </p>
  <p className="text-xs text-muted-foreground">
    {buildTransactionMetaLine({
      typeLabel: typeLabels[t.type],
      accountName: t.accounts?.name ?? "Sin cuenta",
      budgetName: t.budgets?.name ?? null,
    })}
  </p>
  {t.tags && t.tags.length > 0 && (
    <div className="flex flex-wrap gap-1 mt-1">
      {t.tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0 h-4">
          {tag}
        </Badge>
      ))}
    </div>
  )}
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/transactions/transaction-list.tsx
git commit -m "feat: display tags as badges in transaction list"
```

---

### Task A5: Include tags in search filter

**Files:**
- Modify: `src/app/transactions/page.tsx`

- [ ] **Step 1: Extend the search predicate in `filteredTransactions` useMemo (line 47)**

```ts
const filteredTransactions = useMemo(() => {
  let result = transactions;
  if (typeFilter !== "all") {
    result = result.filter((t) => t.type === typeFilter);
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(
      (t) =>
        t.description?.toLowerCase().includes(q) ||
        t.categories?.name?.toLowerCase().includes(q) ||
        t.accounts?.name?.toLowerCase().includes(q) ||
        t.budgets?.name?.toLowerCase().includes(q) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  }
  return result;
}, [transactions, search, typeFilter]);
```

- [ ] **Step 2: Commit**

```bash
git add src/app/transactions/page.tsx
git commit -m "feat: include tags in transaction search filter"
```

---

## Feature B — Per-Account Monthly Activity

### Task B1: Add SWR keys for account activity

**Files:**
- Modify: `src/lib/swr/keys.ts`

- [ ] **Step 1: Add `accountActivity` key**

```ts
import type { CategoryType } from "@/lib/types/database";

export const swrKeyPrefix = {
  accounts: "accounts",
  budgets: "budgets",
  categories: "categories",
  dashboard: "dashboard",
  transactions: "transactions",
} as const;

export const swrKeys = {
  accounts: [swrKeyPrefix.accounts] as const,
  accountActivity: (month: string) => [swrKeyPrefix.accounts, "activity", month] as const,
  budgets: (month: string) => [swrKeyPrefix.budgets, month] as const,
  categories: (type?: CategoryType) => [swrKeyPrefix.categories, type ?? "all"] as const,
  dashboard: (month: string) => [swrKeyPrefix.dashboard, month] as const,
  monthlyComparison: () => [swrKeyPrefix.dashboard, "monthly-comparison"] as const,
  transactions: (month?: string) => [swrKeyPrefix.transactions, month ?? "all"] as const,
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/swr/keys.ts
git commit -m "feat: add accountActivity and monthlyComparison SWR keys"
```

---

### Task B2: Create useAccountActivity hook

**Files:**
- Create: `src/lib/hooks/use-account-activity.ts`

- [ ] **Step 1: Write the hook**

```ts
"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";

export interface AccountActivity {
  income: number;
  expense: number;
}

export function useAccountActivity(month: string) {
  const fetchActivity = useCallback(async (): Promise<Record<string, AccountActivity>> => {
    const supabase = createClient();
    const startDate = `${month}-01`;
    const [y, m] = month.split("-").map(Number);
    const endDate = `${y}-${String(m + 1).padStart(2, "0")}-01`;

    const { data } = await supabase
      .from("transactions")
      .select("account_id, type, amount")
      .gte("date", startDate)
      .lt("date", endDate)
      .in("type", ["income", "expense"]);

    const result: Record<string, AccountActivity> = {};
    for (const t of (data ?? []) as { account_id: string; type: string; amount: number }[]) {
      if (!result[t.account_id]) result[t.account_id] = { income: 0, expense: 0 };
      if (t.type === "income") result[t.account_id].income += t.amount;
      else if (t.type === "expense") result[t.account_id].expense += t.amount;
    }
    return result;
  }, [month]);

  const { data: activity = {}, isLoading: loading } = useSWR(
    swrKeys.accountActivity(month),
    fetchActivity
  );

  return { activity, loading };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/hooks/use-account-activity.ts
git commit -m "feat: add useAccountActivity hook"
```

---

### Task B3: Update AccountCard to show activity

**Files:**
- Modify: `src/components/accounts/account-card.tsx`

- [ ] **Step 1: Add `activity` to props and import `AccountActivity`**

Add the import at the top:
```ts
import type { AccountActivity } from "@/lib/hooks/use-account-activity";
```

Update the props interface:

```ts
interface AccountCardProps {
  account: Account;
  activity?: AccountActivity;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}
```

- [ ] **Step 2: Update the component signature**

```ts
export function AccountCard({ account, activity, onEdit, onDelete }: AccountCardProps) {
```

- [ ] **Step 3: Add activity display after the existing balance block, inside the second `<div>` (after the credit card progress bar section)**

Add after the `account.due_day` paragraph block:

```tsx
{activity && (activity.income > 0 || activity.expense > 0) && (
  <div className="mt-2 flex gap-3 text-xs text-muted-foreground border-t border-border/40 pt-2">
    {activity.income > 0 && (
      <span className="text-emerald-600 font-medium">+{formatCOP(activity.income)}</span>
    )}
    {activity.expense > 0 && (
      <span className="text-rose-600 font-medium">−{formatCOP(activity.expense)}</span>
    )}
    <span>este mes</span>
  </div>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/accounts/account-card.tsx
git commit -m "feat: show monthly income/expense activity on AccountCard"
```

---

### Task B4: Wire activity in accounts page

**Files:**
- Modify: `src/app/accounts/page.tsx`

- [ ] **Step 1: Import `useAccountActivity` and add month state**

Add the import:
```ts
import { useAccountActivity } from "@/lib/hooks/use-account-activity";
```

Add month state inside the component (after the `useAccounts` call):
```ts
const [month] = useState(() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
});
const { activity } = useAccountActivity(month);
```

- [ ] **Step 2: Pass `activity` to each AccountCard**

Find the `accounts.map` block (around line 100) and pass the prop:

```tsx
{accounts.map((account) => (
  <AccountCard
    key={account.id}
    account={account}
    activity={activity[account.id]}
    onEdit={handleEdit}
    onDelete={handleDelete}
  />
))}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/accounts/page.tsx
git commit -m "feat: wire per-account activity into accounts page"
```

---

## Feature C — Income Category View on Dashboard

### Task C1: Add incomeByCategory to useDashboard

**Files:**
- Modify: `src/lib/hooks/use-dashboard.ts`

- [ ] **Step 1: Add `incomeByCategory` to `DashboardData` interface (line 29)**

```ts
interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
  categorySpending: CategorySpending[];
  incomeByCategory: CategorySpending[];
  dailySpending: DailySpending[];
  prevTotalIncome: number;
  prevTotalExpenses: number;
  topGrowthCategory: { name: string; growth: number } | null;
  budgetAlerts: BudgetAlert[];
}
```

- [ ] **Step 2: Add `incomeByCategory: []` to `defaultData`**

```ts
const defaultData: DashboardData = {
  totalIncome: 0,
  totalExpenses: 0,
  totalBalance: 0,
  categorySpending: [],
  incomeByCategory: [],
  dailySpending: [],
  prevTotalIncome: 0,
  prevTotalExpenses: 0,
  topGrowthCategory: null,
  budgetAlerts: [],
};
```

- [ ] **Step 3: Build `incomeCatMap` inside `fetchDashboard` alongside `catMap`**

After `const catMap: Record<string, CategorySpending> = {};` (around line 106), add:
```ts
const incomeCatMap: Record<string, CategorySpending> = {};
```

Inside the `txns.forEach` loop, in the `t.type === "income"` branch (line 110), add the category aggregation:

```ts
if (t.type === "income") {
  if (t.categories?.name !== "Reembolso") {
    totalIncome += t.amount;
    if (t.categories) {
      const key = t.categories.name;
      if (!incomeCatMap[key]) {
        incomeCatMap[key] = {
          name: t.categories.name,
          color: t.categories.color,
          amount: 0,
        };
      }
      incomeCatMap[key].amount += t.amount;
    }
  }
}
```

- [ ] **Step 4: Compute `incomeByCategory` and include it in the return value**

After the `categorySpending` line (around line 177):

```ts
const incomeByCategory = Object.values(incomeCatMap).sort(
  (a, b) => b.amount - a.amount
);
```

Add to the return object:
```ts
return {
  totalIncome,
  totalExpenses,
  totalBalance,
  categorySpending,
  incomeByCategory,
  dailySpending,
  prevTotalIncome,
  prevTotalExpenses,
  topGrowthCategory,
  budgetAlerts,
};
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/hooks/use-dashboard.ts
git commit -m "feat: add income by category to dashboard data"
```

---

### Task C2: Create IncomeByCategory component

**Files:**
- Create: `src/components/dashboard/income-by-category.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { PieChart, Pie, Cell } from "recharts";
import { Card } from "@/components/ui/card";
import { formatCOP } from "@/lib/utils/currency";

interface CategoryData {
  name: string;
  color: string;
  amount: number;
}

export function IncomeByCategory({ data }: { data: CategoryData[] }) {
  if (data.length === 0) {
    return (
      <Card className="section-card p-4 md:p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">Ingresos por categoria</p>
        <p className="py-6 text-center text-xs text-muted-foreground">
          Registra ingresos con categoria para ver el desglose
        </p>
      </Card>
    );
  }

  return (
    <Card className="section-card p-4 md:p-5">
      <p className="mb-3 text-sm font-semibold text-foreground">Ingresos por categoria</p>
      <div className="flex items-center gap-4">
        <div className="w-32 h-32">
          <PieChart width={128} height={128}>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={55}
              paddingAngle={2}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </div>
        <div className="flex-1 space-y-2 overflow-hidden">
          {data.slice(0, 5).map((cat) => (
            <div key={cat.name} className="flex items-center gap-2 text-xs">
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="truncate text-muted-foreground">{cat.name}</span>
              <span className="ml-auto shrink-0 font-semibold tabular-nums text-emerald-600">
                +{formatCOP(cat.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/income-by-category.tsx
git commit -m "feat: add IncomeByCategory dashboard component"
```

---

### Task C3: Add IncomeByCategory to dashboard page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Import the component**

```ts
import { IncomeByCategory } from "@/components/dashboard/income-by-category";
```

- [ ] **Step 2: Render it after `<SpendingByCategory>` (line 181)**

```tsx
<SpendingByCategory data={data.categorySpending} />
<IncomeByCategory data={data.incomeByCategory} />
<MonthlyTrend data={data.dailySpending} />
```

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add income by category chart to dashboard"
```

---

## Feature D — Advanced Transaction Filters

### Task D1: Add account and amount filters to transactions page

**Files:**
- Modify: `src/app/transactions/page.tsx`

This task adds two new filter states and extends the existing `filteredTransactions` `useMemo`. There is no new file — everything stays in the page component, consistent with how the existing type filter is done.

- [ ] **Step 1: Add filter state variables after the existing `typeFilter` state**

```ts
const [accountFilter, setAccountFilter] = useState("");
const [minAmount, setMinAmount] = useState("");
const [maxAmount, setMaxAmount] = useState("");
const [showFilters, setShowFilters] = useState(false);
```

- [ ] **Step 2: Replace the existing `filteredTransactions` useMemo with the extended version**

```ts
const filteredTransactions = useMemo(() => {
  let result = transactions;
  if (typeFilter !== "all") {
    result = result.filter((t) => t.type === typeFilter);
  }
  if (accountFilter) {
    result = result.filter((t) => t.account_id === accountFilter);
  }
  if (minAmount) {
    const min = Number(minAmount.replace(/\D/g, ""));
    if (!isNaN(min)) result = result.filter((t) => t.amount >= min);
  }
  if (maxAmount) {
    const max = Number(maxAmount.replace(/\D/g, ""));
    if (!isNaN(max)) result = result.filter((t) => t.amount <= max);
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(
      (t) =>
        t.description?.toLowerCase().includes(q) ||
        t.categories?.name?.toLowerCase().includes(q) ||
        t.accounts?.name?.toLowerCase().includes(q) ||
        t.budgets?.name?.toLowerCase().includes(q) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  }
  return result;
}, [transactions, search, typeFilter, accountFilter, minAmount, maxAmount]);
```

- [ ] **Step 3: Add an `activeFilterCount` derived value**

```ts
const activeFilterCount = [accountFilter, minAmount, maxAmount].filter(Boolean).length;
```

- [ ] **Step 4: Add the necessary imports at the top of the page**

Add `Filter` to the lucide-react import:
```ts
import { Plus, ChevronLeft, ChevronRight, Search, X, Filter } from "lucide-react";
```

Add shadcn Select imports:
```ts
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
```

- [ ] **Step 5: Add the filter toggle button and filter panel in the JSX**

Replace the `<div className="flex gap-1">` type filter row with this extended block:

```tsx
<div className="flex items-center justify-between gap-2">
  <div className="flex gap-1 flex-1 overflow-x-auto">
    {([
      ["all", "Todos"],
      ["expense", "Gastos"],
      ["income", "Ingresos"],
      ["transfer", "Transferencias"],
    ] as const).map(([value, label]) => (
      <Button
        key={value}
        variant={typeFilter === value ? "default" : "ghost"}
        size="sm"
        className="h-7 px-2.5 text-xs shrink-0"
        onClick={() => setTypeFilter(value)}
      >
        {label}
      </Button>
    ))}
  </div>
  <Button
    variant={showFilters ? "default" : "outline"}
    size="sm"
    className="h-7 px-2.5 text-xs shrink-0 gap-1"
    onClick={() => setShowFilters((v) => !v)}
  >
    <Filter className="h-3.5 w-3.5" />
    Filtros
    {activeFilterCount > 0 && (
      <Badge className="h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center ml-0.5">
        {activeFilterCount}
      </Badge>
    )}
  </Button>
</div>

{showFilters && (
  <div className="rounded-lg border border-border/60 p-3 space-y-3">
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">Cuenta</p>
      <Select value={accountFilter} onValueChange={setAccountFilter}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Todas las cuentas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todas las cuentas</SelectItem>
          {accounts.map((a) => (
            <SelectItem key={a.id} value={a.id} label={a.name}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Monto mínimo</p>
        <Input
          type="number"
          placeholder="0"
          value={minAmount}
          onChange={(e) => setMinAmount(e.target.value)}
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Monto máximo</p>
        <Input
          type="number"
          placeholder="Sin límite"
          value={maxAmount}
          onChange={(e) => setMaxAmount(e.target.value)}
          className="h-8 text-xs"
        />
      </div>
    </div>
    {activeFilterCount > 0 && (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs w-full"
        onClick={() => {
          setAccountFilter("");
          setMinAmount("");
          setMaxAmount("");
        }}
      >
        Limpiar filtros
      </Button>
    )}
  </div>
)}
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/transactions/page.tsx
git commit -m "feat: add account and amount range filters to transactions"
```

---

## Feature E — 6-Month Income/Expense Comparison Chart

### Task E1: Create useMonthlyComparison hook

**Files:**
- Create: `src/lib/hooks/use-monthly-comparison.ts`

- [ ] **Step 1: Write the hook**

The hook fetches the last 6 months of transactions (no dependency on selected month — always shows the trailing 6 months ending at current month) and returns an array of monthly totals.

```ts
"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";

export interface MonthComparison {
  month: string;   // "YYYY-MM", used as key
  label: string;   // "Abr", short localized label
  income: number;
  expenses: number;
}

function getTrailing6Months(): { start: string; end: string; months: string[] } {
  const now = new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }
  const start = `${months[0]}-01`;
  const [y, m] = months[months.length - 1].split("-").map(Number);
  const end = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return { start, end, months };
}

function shortMonthLabel(yyyyMM: string): string {
  const [y, m] = yyyyMM.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", { month: "short" }).format(
    new Date(y, m - 1, 1)
  );
}

export function useMonthlyComparison() {
  const fetchComparison = useCallback(async (): Promise<MonthComparison[]> => {
    const supabase = createClient();
    const { start, end, months } = getTrailing6Months();

    const { data } = await supabase
      .from("transactions")
      .select("date, type, amount, categories(name)")
      .gte("date", start)
      .lt("date", end)
      .in("type", ["income", "expense"]);

    const totals: Record<string, { income: number; expenses: number }> = {};
    for (const mo of months) totals[mo] = { income: 0, expenses: 0 };

    type Row = { date: string; type: string; amount: number; categories: { name: string } | null };
    for (const t of (data ?? []) as unknown as Row[]) {
      const mo = t.date.slice(0, 7);
      if (!totals[mo]) continue;
      if (t.type === "income" && t.categories?.name !== "Reembolso") {
        totals[mo].income += t.amount;
      } else if (t.type === "expense") {
        totals[mo].expenses += t.amount;
      }
    }

    return months.map((mo) => ({
      month: mo,
      label: shortMonthLabel(mo),
      income: totals[mo].income,
      expenses: totals[mo].expenses,
    }));
  }, []);

  const { data: comparison = [], isLoading: loading } = useSWR(
    swrKeys.monthlyComparison(),
    fetchComparison
  );

  return { comparison, loading };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/hooks/use-monthly-comparison.ts
git commit -m "feat: add useMonthlyComparison hook"
```

---

### Task E2: Create MonthlyComparison chart component

**Files:**
- Create: `src/components/dashboard/monthly-comparison.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { formatCOP } from "@/lib/utils/currency";
import { useMonthlyComparison } from "@/lib/hooks/use-monthly-comparison";

export function MonthlyComparison() {
  const { comparison, loading } = useMonthlyComparison();

  if (loading) {
    return (
      <Card className="section-card p-4 md:p-5 h-48 animate-pulse" />
    );
  }

  const hasData = comparison.some((m) => m.income > 0 || m.expenses > 0);

  if (!hasData) {
    return (
      <Card className="section-card p-4 md:p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">Comparativa mensual</p>
        <p className="py-6 text-center text-xs text-muted-foreground">
          Registra movimientos para ver la comparativa de los últimos 6 meses
        </p>
      </Card>
    );
  }

  return (
    <Card className="section-card p-4 md:p-5">
      <p className="mb-3 text-sm font-semibold text-foreground">Comparativa mensual</p>
      <div className="min-w-0">
        <ResponsiveContainer width="100%" height={180} minWidth={0} minHeight={180}>
          <BarChart data={comparison} barCategoryGap="30%">
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #dbe4ee",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number, name: string) => [
                formatCOP(value),
                name === "income" ? "Ingresos" : "Gastos",
              ]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-xs text-muted-foreground">
                  {value === "income" ? "Ingresos" : "Gastos"}
                </span>
              )}
            />
            <Bar dataKey="income" fill="#059669" radius={[3, 3, 0, 0]} name="income" />
            <Bar dataKey="expenses" fill="#e11d48" radius={[3, 3, 0, 0]} name="expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/monthly-comparison.tsx
git commit -m "feat: add MonthlyComparison bar chart component"
```

---

### Task E3: Add MonthlyComparison to dashboard page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Import MonthlyComparison**

```ts
import { MonthlyComparison } from "@/components/dashboard/monthly-comparison";
```

- [ ] **Step 2: Render it after `MonthlyTrend` (line 182)**

```tsx
<SpendingByCategory data={data.categorySpending} />
<IncomeByCategory data={data.incomeByCategory} />
<MonthlyTrend data={data.dailySpending} />
<MonthlyComparison />
```

Note: `MonthlyComparison` fetches its own data internally via `useMonthlyComparison`, so no props are needed.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add monthly comparison chart to dashboard"
```

---

## Final check

- [ ] Run the dev server and verify all 5 features visually:

```bash
npm run dev
```

Checklist:
1. `/transactions` → create a transaction → add tags → save → tags appear as badges in the list
2. `/transactions` → click "Filtros" → filter by account → results narrow correctly
3. `/transactions` → search by a tag name → matching transactions appear
4. `/accounts` → each card shows "este mes" income/expense if there are transactions
5. `/` (dashboard) → "Ingresos por categoria" chart appears
6. `/` (dashboard) → "Comparativa mensual" bar chart shows last 6 months

- [ ] Final commit if any last-minute fixes were needed

```bash
git add -p
git commit -m "fix: final adjustments after manual testing"
```
