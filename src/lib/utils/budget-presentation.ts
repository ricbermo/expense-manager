export interface BudgetProgressInput {
  id: string;
  limit_amount: number;
  spent: number;
}

export type BudgetPriorityKind = "exceeded" | "alert" | "healthy" | "invalid";

export interface BudgetCopyResult {
  sourceCount: number;
  copiedCount: number;
  skippedCount: number;
}

export function getBudgetErrorMessage(error: { message?: string } | null) {
  return (
    error?.message ||
    "No se pudieron cargar los presupuestos. Intenta de nuevo."
  );
}

export function getBudgetPriority(budget: BudgetProgressInput) {
  if (!Number.isFinite(budget.limit_amount) || budget.limit_amount <= 0) {
    return { kind: "invalid" as const, percentage: null };
  }

  const percentage = Math.round((budget.spent / budget.limit_amount) * 100);
  if (percentage >= 100) return { kind: "exceeded" as const, percentage };
  if (percentage >= 80) return { kind: "alert" as const, percentage };
  return { kind: "healthy" as const, percentage };
}

export function orderBudgetsByPriority<T extends BudgetProgressInput>(
  budgets: T[],
) {
  const rank: Record<BudgetPriorityKind, number> = {
    exceeded: 0,
    alert: 1,
    healthy: 2,
    invalid: 3,
  };

  return budgets
    .map((budget, index) => ({
      budget,
      index,
      rank: rank[getBudgetPriority(budget).kind],
    }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ budget }) => budget);
}

export function getBudgetSummary(budgets: BudgetProgressInput[]) {
  const exceeded = budgets.filter(
    (budget) => getBudgetPriority(budget).kind === "exceeded",
  );
  if (exceeded.length > 0) {
    return {
      kind: "exceeded" as const,
      budgetCount: exceeded.length,
      amount: exceeded.reduce(
        (total, budget) => total + (budget.spent - budget.limit_amount),
        0,
      ),
    };
  }

  return {
    kind: "available" as const,
    budgetCount: 0,
    amount: budgets.reduce(
      (total, budget) =>
        total + Math.max(0, budget.limit_amount - budget.spent),
      0,
    ),
  };
}

export function getBudgetCopyMessage({
  sourceCount,
  copiedCount,
  skippedCount,
}: BudgetCopyResult) {
  if (sourceCount === 0) {
    return "No había presupuestos para copiar del mes anterior.";
  }

  if (copiedCount === 0) {
    return "Todos los presupuestos del mes anterior ya existen.";
  }

  const copiedLabel = copiedCount === 1 ? "presupuesto" : "presupuestos";
  if (skippedCount === 0) {
    return `Se copiaron ${copiedCount} ${copiedLabel}.`;
  }

  return `Se copiaron ${copiedCount} ${copiedLabel}. ${skippedCount} ya ${skippedCount === 1 ? "existía" : "existían"}.`;
}
