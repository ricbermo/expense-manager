import assert from "node:assert/strict";
import test from "node:test";
import {
  formatIntegerInput,
  parseDecimalInput,
  parseDueDayInput,
  parseIntegerInput,
  sanitizeDecimalInput,
} from "../src/lib/utils/number-input-format.ts";

test("formats integer input with es-CO thousands", () => {
  assert.equal(formatIntegerInput("5000000"), "5.000.000");
});

test("parses formatted integer input to number", () => {
  assert.equal(parseIntegerInput("5.000.000"), 5000000);
});

test("normalizes decimal input and limits decimals", () => {
  assert.equal(sanitizeDecimalInput("28,567", 2), "28.56");
  assert.equal(sanitizeDecimalInput("12..3a4", 2), "12.34");
});

test("parses decimal input safely", () => {
  assert.equal(parseDecimalInput("28.5"), 28.5);
  assert.equal(parseDecimalInput(""), 0);
});

test("normalizes due day to 1-31 range", () => {
  assert.equal(parseDueDayInput("0"), null);
  assert.equal(parseDueDayInput("40"), 31);
  assert.equal(parseDueDayInput("15"), 15);
  assert.equal(parseDueDayInput("abc"), null);
});
