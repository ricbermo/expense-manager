import assert from "node:assert/strict";
import test from "node:test";
import { getTransactionsErrorMessage } from "../src/lib/utils/transactions-error.ts";

test("returns the original Supabase message when present", () => {
  assert.equal(
    getTransactionsErrorMessage({ message: "permission denied" }),
    "permission denied"
  );
});

test("falls back to a friendly message when error has no message", () => {
  assert.equal(
    getTransactionsErrorMessage({ code: "PGRST201" }),
    "No se pudieron cargar los movimientos. Intenta de nuevo."
  );
});

test("falls back to a friendly message for null errors", () => {
  assert.equal(
    getTransactionsErrorMessage(null),
    "No se pudieron cargar los movimientos. Intenta de nuevo."
  );
});
