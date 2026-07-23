import assert from "node:assert/strict";
import test from "node:test";
import { normalizeParsed } from "../src/lib/sms/normalize.ts";

const TODAY = "2026-07-20";

test("acepta un JSON bien formado de compra con TC", () => {
  const input = {
    amount: 75000,
    merchant: "COMERCIALIZADORA Y DIS",
    accountId: "acc-tc-1",
    categoryId: "cat-food",
    type: "expense",
    date: "2026-07-16",
    description: "Compra TC",
    ignoreReason: null,
  };

  const result = normalizeParsed(input, TODAY);
  assert.equal(result.amount, 75000);
  assert.equal(result.merchant, "COMERCIALIZADORA Y DIS");
  assert.equal(result.accountId, "acc-tc-1");
  assert.equal(result.categoryId, "cat-food");
  assert.equal(result.type, "expense");
  assert.equal(result.date, "2026-07-16");
  assert.equal(result.description, "Compra TC");
  assert.equal(result.ignoreReason, null);
});

test("marca transferencias internas como ignoreReason", () => {
  const result = normalizeParsed(
    {
      amount: 0,
      merchant: null,
      accountId: null,
      categoryId: null,
      type: "expense",
      date: "2026-07-20",
      description: null,
      ignoreReason: "internal_transfer",
    },
    TODAY,
  );
  assert.equal(result.ignoreReason, "internal_transfer");
  assert.equal(result.amount, 0);
});

test("usa la fecha actual cuando la IA no responde date valida", () => {
  const result = normalizeParsed(
    {
      amount: 50000,
      type: "expense",
      ignoreReason: null,
      date: "no-es-una-fecha",
    },
    TODAY,
  );
  assert.equal(result.date, TODAY);
});

test("usa la fecha actual cuando falta date", () => {
  const result = normalizeParsed(
    { amount: 50000, type: "expense", ignoreReason: null },
    TODAY,
  );
  assert.equal(result.date, TODAY);
});

test("rechaza tipos de transaccion invalidos", () => {
  const result = normalizeParsed(
    { amount: 100, type: "weird", date: "2026-07-20", ignoreReason: null },
    TODAY,
  );
  assert.equal(result.type, null);
});

test("redondea y rechaza montos no numericos o negativos", () => {
  const r1 = normalizeParsed(
    { amount: -100, type: "expense", date: "2026-07-20", ignoreReason: null },
    TODAY,
  );
  assert.equal(r1.amount, null);

  const r2 = normalizeParsed(
    {
      amount: "50.000",
      type: "expense",
      date: "2026-07-20",
      ignoreReason: null,
    },
    TODAY,
  );
  assert.equal(r2.amount, null);

  const r3 = normalizeParsed(
    { amount: 1234.7, type: "expense", date: "2026-07-20", ignoreReason: null },
    TODAY,
  );
  assert.equal(r3.amount, 1235);
});

test("rechaza ignoreReason desconocido", () => {
  const result = normalizeParsed(
    {
      amount: 100,
      type: "expense",
      date: "2026-07-20",
      ignoreReason: "some_other_reason",
    },
    TODAY,
  );
  assert.equal(result.ignoreReason, null);
});

test("trimea merchant y description", () => {
  const result = normalizeParsed(
    {
      amount: 100,
      merchant: "  JUMBO  ",
      description: "  Compra  ",
      accountId: "  acc-1  ",
      categoryId: "  cat-1  ",
      type: "expense",
      date: "2026-07-20",
      ignoreReason: null,
    },
    TODAY,
  );
  assert.equal(result.merchant, "JUMBO");
  assert.equal(result.description, "Compra");
  assert.equal(result.accountId, "acc-1");
  assert.equal(result.categoryId, "cat-1");
});

test("input no objeto produce objeto vacio", () => {
  const r1 = normalizeParsed(null, TODAY);
  const r2 = normalizeParsed("hello", TODAY);
  const r3 = normalizeParsed(undefined, TODAY);
  for (const r of [r1, r2, r3]) {
    assert.equal(r.amount, null);
    assert.equal(r.type, null);
    assert.equal(r.date, null);
    assert.equal(r.ignoreReason, null);
  }
});

test("acepta type income para abonos", () => {
  const result = normalizeParsed(
    {
      amount: 1000000,
      merchant: null,
      accountId: "acc-1",
      categoryId: "cat-salary",
      type: "income",
      date: "2026-07-30",
      description: "Salario",
      ignoreReason: null,
    },
    TODAY,
  );
  assert.equal(result.type, "income");
  assert.equal(result.amount, 1000000);
});
