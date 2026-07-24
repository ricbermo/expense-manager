import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedUserEmail } from "../src/lib/auth/allowed-user.ts";

test("accepts the fallback allowed email", () => {
  assert.equal(isAllowedUserEmail("your-email@example.com"), true);
});

test("normalizes case and whitespace", () => {
  assert.equal(isAllowedUserEmail("  Your-Email@Example.com  "), true);
});

test("rejects other emails", () => {
  assert.equal(isAllowedUserEmail("other@email.com"), false);
});
