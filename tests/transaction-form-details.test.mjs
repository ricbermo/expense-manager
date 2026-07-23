import assert from "node:assert/strict";
import test from "node:test";
import { shouldShowTransactionDetails } from "../src/lib/utils/transaction-form-details.ts";

test("opens details for an edited transaction with advanced data", () => {
  assert.equal(
    shouldShowTransactionDetails({
      type: "expense",
      budget_id: "budget-1",
      description: null,
      tags: [],
      to_account_id: null,
      installments: 1,
      is_occasional: false,
    }),
    true,
  );
});

test("keeps a plain default expense compact", () => {
  assert.equal(
    shouldShowTransactionDetails({
      type: "expense",
      budget_id: null,
      description: null,
      tags: [],
      to_account_id: null,
      installments: 1,
      is_occasional: false,
    }),
    false,
  );
});

test("opens details for income category and transfer destination", () => {
  assert.equal(
    shouldShowTransactionDetails({
      type: "income",
      category_id: "salary",
      description: null,
      tags: [],
    }),
    true,
  );
  assert.equal(
    shouldShowTransactionDetails({
      type: "transfer",
      to_account_id: "account-2",
      description: null,
      tags: [],
    }),
    true,
  );
});
