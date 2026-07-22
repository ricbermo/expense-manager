import assert from "node:assert/strict";
import test from "node:test";
import {
  getStatementPaymentSummary,
  orderAccountsForReconciliation,
  validateStatement,
  validateStatementPayment,
} from "../src/lib/utils/credit-card-statements.ts";

const statement = (overrides = {}) => ({
  id: "statement-1",
  account_id: "card-1",
  statement_date: "2026-07-01",
  due_date: "2026-07-15",
  total_balance: 500_000,
  minimum_payment: 50_000,
  payments: [],
  ...overrides,
});

test("keeps a statement open after a partial payment", () => {
  assert.deepEqual(
    getStatementPaymentSummary(
      statement({ payments: [{ transaction_id: "payment-1", amount: 50_000 }] })
    ),
    { paidAmount: 50_000, remainingAmount: 450_000, isPaid: false }
  );
});

test("settles a statement only when its cumulative payments cover the total", () => {
  assert.deepEqual(
    getStatementPaymentSummary(
      statement({
        payments: [
          { transaction_id: "payment-1", amount: 50_000 },
          { transaction_id: "payment-2", amount: 450_000 },
        ],
      })
    ),
    { paidAmount: 500_000, remainingAmount: 0, isPaid: true }
  );
});

test("does not double-count a payment transaction", () => {
  assert.deepEqual(
    getStatementPaymentSummary(
      statement({
        payments: [
          { transaction_id: "payment-1", amount: 100_000 },
          { transaction_id: "payment-1", amount: 100_000 },
        ],
      })
    ),
    { paidAmount: 100_000, remainingAmount: 400_000, isPaid: false }
  );
});

test("sorts accounts with the nearest open obligation first", () => {
  const ordered = orderAccountsForReconciliation(
    [
      { id: "savings", name: "Ahorros", type: "savings", balance: 1_000_000 },
      { id: "card-later", name: "Tarjeta B", type: "credit_card", balance: -200_000 },
      { id: "card-sooner", name: "Tarjeta A", type: "credit_card", balance: -100_000 },
    ],
    [
      statement({ account_id: "card-later", due_date: "2026-07-20" }),
      statement({ account_id: "card-sooner", due_date: "2026-07-10" }),
    ]
  );

  assert.deepEqual(ordered.map((account) => account.id), [
    "card-sooner",
    "card-later",
    "savings",
  ]);
});

test("rejects incoherent statement amounts and dates", () => {
  assert.equal(
    validateStatement({
      totalBalance: 0,
      minimumPayment: 0,
      statementDate: "2026-07-15",
      dueDate: "2026-07-14",
    }),
    "El saldo del extracto debe ser mayor que cero."
  );
  assert.equal(
    validateStatement({
      totalBalance: 100_000,
      minimumPayment: 150_000,
      statementDate: "2026-07-01",
      dueDate: "2026-07-15",
    }),
    "El pago mínimo no puede superar el saldo del extracto."
  );
  assert.equal(
    validateStatement({
      totalBalance: 100_000,
      minimumPayment: 10_000,
      statementDate: "2026-07-15",
      dueDate: "2026-07-14",
    }),
    "La fecha límite no puede ser anterior a la fecha del extracto."
  );
});

test("rejects a payment above the remaining statement balance or source funds", () => {
  assert.equal(
    validateStatementPayment({ amount: 0, remainingAmount: 100_000, sourceBalance: 200_000 }),
    "El monto debe ser mayor que cero."
  );
  assert.equal(
    validateStatementPayment({ amount: 150_000, remainingAmount: 100_000, sourceBalance: 200_000 }),
    "El monto supera el saldo pendiente del extracto."
  );
  assert.equal(
    validateStatementPayment({ amount: 100_000, remainingAmount: 100_000, sourceBalance: 50_000 }),
    "La cuenta de origen no tiene saldo suficiente."
  );
});
