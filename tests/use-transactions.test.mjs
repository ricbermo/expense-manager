import assert from "node:assert/strict";
import test from "node:test";
import { getTransactionsErrorMessage } from "../src/lib/utils/transactions-error.ts";

test("hides a technical Supabase message", () => {
  assert.equal(
    getTransactionsErrorMessage({ message: "permission denied" }),
    "No se pudieron cargar los movimientos. Intenta de nuevo.",
  );
});

test("maps destination-account errors to an actionable message", () => {
  assert.equal(
    getTransactionsErrorMessage({
      message: "Destination account is no longer available",
    }),
    "La cuenta destino no está disponible. Elige otra e inténtalo de nuevo.",
  );
});

test("falls back to a friendly message when error has no message", () => {
  assert.equal(
    getTransactionsErrorMessage({ code: "PGRST201" }),
    "No se pudieron cargar los movimientos. Intenta de nuevo.",
  );
});

test("falls back to a friendly message for null errors", () => {
  assert.equal(
    getTransactionsErrorMessage(null),
    "No se pudieron cargar los movimientos. Intenta de nuevo.",
  );
});
