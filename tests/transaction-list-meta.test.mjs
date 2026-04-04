import assert from "node:assert/strict";
import test from "node:test";
import { buildTransactionMetaLine } from "../src/lib/utils/transaction-list-meta.ts";

test("buildTransactionMetaLine shows type and account when budget is missing", () => {
  const result = buildTransactionMetaLine({
    typeLabel: "Gasto",
    accountName: "Nequi",
    budgetName: null,
  });

  assert.equal(result, "Gasto · Nequi");
});

test("buildTransactionMetaLine appends budget only when present", () => {
  const result = buildTransactionMetaLine({
    typeLabel: "Gasto",
    accountName: "Davivienda",
    budgetName: "Mercado",
  });

  assert.equal(result, "Gasto · Davivienda · Presupuesto: Mercado");
});
