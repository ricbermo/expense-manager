import assert from "node:assert/strict";
import test from "node:test";
import { formatCOP } from "../src/lib/utils/currency.ts";

test("starts with peso sign", () => {
  assert.ok(formatCOP(150000).startsWith("$"));
});

test("formats zero", () => {
  assert.ok(formatCOP(0).endsWith("0"));
});

test("uses dot as thousands separator", () => {
  assert.ok(formatCOP(150000).includes("150.000"));
});

test("formats millions with dot separators", () => {
  assert.ok(formatCOP(2500000).includes("2.500.000"));
});

test("handles negative amounts", () => {
  assert.ok(formatCOP(-50000).startsWith("-"));
});

test("has no decimal places (uses comma as decimal separator)", () => {
  assert.ok(!formatCOP(123456).includes(","));
});

test("rounds fractional cents", () => {
  assert.ok(formatCOP(123456.789).includes("123.457"));
});
