import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedUserEmail } from "../src/lib/auth/allowed-user.ts";

test("acepta el correo permitido", () => {
  assert.equal(isAllowedUserEmail("rickardoberdejo@gmail.com"), true);
});

test("normaliza mayusculas y espacios", () => {
  assert.equal(isAllowedUserEmail("  RickardoBerdejo@gmail.com  "), true);
});

test("rechaza correos distintos", () => {
  assert.equal(isAllowedUserEmail("otro@correo.com"), false);
});
