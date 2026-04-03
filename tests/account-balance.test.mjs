import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeStoredBalance,
  toBalanceFieldValue,
} from "../src/lib/utils/account-balance.ts";

test("normaliza deuda de tarjeta como balance negativo", () => {
  assert.equal(normalizeStoredBalance("credit_card", 250000), -250000);
});

test("normaliza deuda de prestamo como balance negativo", () => {
  assert.equal(normalizeStoredBalance("loan", 900000), -900000);
});

test("mantiene balance de ahorro tal cual", () => {
  assert.equal(normalizeStoredBalance("savings", 900000), 900000);
});

test("muestra deuda como valor positivo en el formulario", () => {
  assert.equal(toBalanceFieldValue("credit_card", -175000), 175000);
});
