import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTransactionMetaLine,
  getTransactionAmountPrefix,
} from "../src/lib/utils/transaction-list-meta.ts";

test("buildTransactionMetaLine shows type and account when budget is missing", () => {
  const result = buildTransactionMetaLine({
    type: "expense",
    accountName: "Nequi",
    destinationAccountName: null,
    budgetName: null,
  });

  assert.equal(result, "Gasto · Nequi");
});

test("buildTransactionMetaLine appends budget only when present", () => {
  const result = buildTransactionMetaLine({
    type: "expense",
    accountName: "Davivienda",
    destinationAccountName: null,
    budgetName: "Mercado",
  });

  assert.equal(result, "Gasto · Davivienda · Presupuesto: Mercado");
});

test("buildTransactionMetaLine shows a transfer route when destination exists", () => {
  assert.equal(
    buildTransactionMetaLine({
      type: "transfer",
      accountName: "Nequi",
      destinationAccountName: "Davivienda",
      budgetName: null,
    }),
    "Transferencia · Nequi → Davivienda",
  );
});

test("buildTransactionMetaLine falls back to the source when transfer destination is missing", () => {
  assert.equal(
    buildTransactionMetaLine({
      type: "transfer",
      accountName: "Nequi",
      destinationAccountName: null,
      budgetName: null,
    }),
    "Transferencia · Nequi",
  );
});

test("buildTransactionMetaLine labels income without a budget", () => {
  assert.equal(
    buildTransactionMetaLine({
      type: "income",
      accountName: "Davivienda",
      destinationAccountName: null,
      budgetName: null,
    }),
    "Ingreso · Davivienda",
  );
});

test("getTransactionAmountPrefix keeps transfers neutral", () => {
  assert.equal(getTransactionAmountPrefix("expense"), "-");
  assert.equal(getTransactionAmountPrefix("income"), "+");
  assert.equal(getTransactionAmountPrefix("transfer"), "");
});
