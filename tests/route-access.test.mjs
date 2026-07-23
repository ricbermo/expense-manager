import assert from "node:assert/strict";
import test from "node:test";
import { isProtectedPath, isPublicPath } from "../src/lib/auth/route-access.ts";

test("/login es publica", () => {
  assert.equal(isPublicPath("/login"), true);
});

test("/accounts es privada", () => {
  assert.equal(isPublicPath("/accounts"), false);
  assert.equal(isProtectedPath("/accounts"), true);
});

test("/ es privada", () => {
  assert.equal(isProtectedPath("/"), true);
});

test("otras rutas fuera del dominio no son privadas", () => {
  assert.equal(isProtectedPath("/manifest.webmanifest"), false);
});
