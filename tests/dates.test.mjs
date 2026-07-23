import assert from "node:assert/strict";
import test from "node:test";
import {
  getCurrentMonth,
  getMonthStart,
  formatDate,
  formatMonthYear,
} from "../src/lib/utils/dates.ts";

test("getCurrentMonth returns YYYY-MM format", () => {
  const result = getCurrentMonth();
  assert.match(result, /^\d{4}-\d{2}$/);
});

test("getCurrentMonth matches current year and month", () => {
  const now = new Date();
  const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  assert.equal(getCurrentMonth(), expected);
});

test("getMonthStart returns YYYY-MM-01 for default date", () => {
  const now = new Date();
  const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  assert.equal(getMonthStart(), expected);
});

test("getMonthStart returns YYYY-MM-01 for given date", () => {
  assert.equal(getMonthStart(new Date(2025, 0, 15)), "2025-01-01");
  assert.equal(getMonthStart(new Date(2024, 11, 25)), "2024-12-01");
});

test("formatDate formats ISO date string correctly", () => {
  assert.equal(formatDate("2025-01-15"), "15 de ene de 2025");
});

test("formatDate formats Date object", () => {
  assert.equal(formatDate(new Date(2024, 11, 25)), "25 de dic de 2024");
});

test("formatDate formats date in numerical string format", () => {
  assert.equal(formatDate("2025/03/10"), "10 de mar de 2025");
});

test("formatMonthYear formats ISO date to month and year only", () => {
  assert.equal(formatMonthYear("2025-01-15"), "enero de 2025");
});

test("formatMonthYear formats Date object", () => {
  assert.equal(formatMonthYear(new Date(2024, 11, 25)), "diciembre de 2024");
});
