import assert from "node:assert/strict";
import test from "node:test";
import {
  isDestinationSelectionValid,
  isDestinationRequired,
} from "../src/lib/utils/transaction-destination-rules.ts";

test("transfer and expense do not require destination", () => {
  assert.equal(isDestinationRequired("transfer"), false);
  assert.equal(isDestinationRequired("expense"), false);
});

test("income ignores destination validation", () => {
  assert.equal(isDestinationSelectionValid("income", "a", "a"), true);
});

test("transfer/expense allow empty destination", () => {
  assert.equal(isDestinationSelectionValid("transfer", "a", ""), true);
  assert.equal(isDestinationSelectionValid("expense", "a", ""), true);
});

test("transfer/expense reject same origin and destination", () => {
  assert.equal(isDestinationSelectionValid("transfer", "a", "a"), false);
  assert.equal(isDestinationSelectionValid("expense", "a", "a"), false);
});

test("transfer/expense allow different destination", () => {
  assert.equal(isDestinationSelectionValid("transfer", "a", "b"), true);
  assert.equal(isDestinationSelectionValid("expense", "a", "b"), true);
});
