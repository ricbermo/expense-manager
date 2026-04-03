import assert from "node:assert/strict";
import test from "node:test";
import {
  isDestinationSelectionValid,
  isDestinationRequired,
} from "../src/lib/utils/transaction-destination-rules.ts";

test("transfer and payment do not require destination", () => {
  assert.equal(isDestinationRequired("transfer"), false);
  assert.equal(isDestinationRequired("payment"), false);
});

test("expense and income ignore destination validation", () => {
  assert.equal(isDestinationSelectionValid("expense", "a", ""), true);
  assert.equal(isDestinationSelectionValid("income", "a", "a"), true);
});

test("transfer/payment allow empty destination", () => {
  assert.equal(isDestinationSelectionValid("transfer", "a", ""), true);
  assert.equal(isDestinationSelectionValid("payment", "a", ""), true);
});

test("transfer/payment reject same origin and destination", () => {
  assert.equal(isDestinationSelectionValid("transfer", "a", "a"), false);
  assert.equal(isDestinationSelectionValid("payment", "a", "a"), false);
});

test("transfer/payment allow different destination", () => {
  assert.equal(isDestinationSelectionValid("transfer", "a", "b"), true);
  assert.equal(isDestinationSelectionValid("payment", "a", "b"), true);
});
