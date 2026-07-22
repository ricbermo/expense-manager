import assert from "node:assert/strict";
import test from "node:test";
import {
  getBudgetCopyMessage,
  getBudgetErrorMessage,
  getBudgetPriority,
  getBudgetSummary,
  orderBudgetsByPriority,
} from "../src/lib/utils/budget-presentation.ts";

const budget = (id, limitAmount, spent) => ({
  id,
  limit_amount: limitAmount,
  spent,
});

test("orders exceeded budgets before alerts and healthy budgets stably", () => {
  const ordered = orderBudgetsByPriority([
    budget("healthy", 100_000, 50_000),
    budget("alert", 100_000, 80_000),
    budget("exceeded", 100_000, 110_000),
    budget("healthy-second", 100_000, 30_000),
  ]);

  assert.deepEqual(ordered.map((item) => item.id), [
    "exceeded",
    "alert",
    "healthy",
    "healthy-second",
  ]);
});

test("summarizes exceeded budgets before available money", () => {
  assert.deepEqual(
    getBudgetSummary([
      budget("a", 100_000, 120_000),
      budget("b", 200_000, 50_000),
    ]),
    { kind: "exceeded", budgetCount: 1, amount: 20_000 }
  );
});

test("summarizes available money when no budget is exceeded", () => {
  assert.deepEqual(
    getBudgetSummary([
      budget("a", 100_000, 80_000),
      budget("b", 200_000, 50_000),
    ]),
    { kind: "available", budgetCount: 0, amount: 170_000 }
  );
});

test("marks invalid persisted limits without computing a percentage", () => {
  assert.deepEqual(getBudgetPriority(budget("invalid", 0, 10_000)), {
    kind: "invalid",
    percentage: null,
  });
});

test("describes a missing source month precisely", () => {
  assert.equal(
    getBudgetCopyMessage({ sourceCount: 0, copiedCount: 0, skippedCount: 0 }),
    "No había presupuestos para copiar del mes anterior."
  );
});

test("describes copied and skipped budgets precisely", () => {
  assert.equal(
    getBudgetCopyMessage({ sourceCount: 3, copiedCount: 2, skippedCount: 1 }),
    "Se copiaron 2 presupuestos. 1 ya existía."
  );
});

test("keeps a specific budget load error message", () => {
  assert.equal(
    getBudgetErrorMessage({ message: "permission denied" }),
    "permission denied"
  );
});

test("uses a friendly message when budget loading has no detail", () => {
  assert.equal(
    getBudgetErrorMessage(null),
    "No se pudieron cargar los presupuestos. Intenta de nuevo."
  );
});
