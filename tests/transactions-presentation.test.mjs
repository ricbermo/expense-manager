import assert from "node:assert/strict";
import test from "node:test";
import {
  getTransactionDeleteLabels,
  shouldHandleNewTransactionShortcut,
  TRANSACTION_SEARCH_EMPTY_MESSAGE,
} from "../src/lib/utils/transactions-presentation.ts";

test("uses explicit labels for transaction deletion", () => {
  assert.deepEqual(getTransactionDeleteLabels(), {
    confirm: "Eliminar movimiento",
    cancel: "Cancelar",
  });
});

test("uses the corrected search empty-state copy", () => {
  assert.equal(
    TRANSACTION_SEARCH_EMPTY_MESSAGE,
    "Intenta con otro filtro o búsqueda",
  );
});

test("ignores the new-transaction shortcut while typing", () => {
  assert.equal(
    shouldHandleNewTransactionShortcut({
      key: "n",
      target: { tagName: "INPUT" },
    }),
    false,
  );
  assert.equal(
    shouldHandleNewTransactionShortcut({
      key: "n",
      target: { tagName: "BODY" },
    }),
    true,
  );
  assert.equal(
    shouldHandleNewTransactionShortcut({ key: "n", target: null }),
    true,
  );
});
