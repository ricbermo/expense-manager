import assert from "node:assert/strict";
import test from "node:test";
import { buildPrompt } from "../src/lib/sms/prompt.ts";

test("incluye las cuentas del usuario en el prompt", () => {
  const prompt = buildPrompt({
    rawSms: "Compra $50,000 en JUMBO",
    sender: "Davivienda",
    accounts: [
      { id: "acc-1", name: "Davivienda Ahorros", type: "savings" },
      { id: "acc-2", name: "Davivienda TC", type: "credit_card" },
    ],
    categories: [{ id: "cat-1", name: "Comida" }],
  });

  assert.match(prompt, /Davivienda Ahorros/);
  assert.match(prompt, /Davivienda TC/);
  assert.match(prompt, /acc-1/);
  assert.match(prompt, /acc-2/);
});

test("incluye las categorias de gasto en el prompt", () => {
  const prompt = buildPrompt({
    rawSms: "Compra $50,000",
    accounts: [],
    categories: [
      { id: "cat-food", name: "Comida" },
      { id: "cat-transport", name: "Transporte" },
    ],
  });

  assert.match(prompt, /Comida/);
  assert.match(prompt, /Transporte/);
  assert.match(prompt, /cat-food/);
  assert.match(prompt, /cat-transport/);
});

test("incluye el SMS crudo tal cual", () => {
  const sms = "DAVIVIENDA: Compra . Aprobado(a), $75,000, Tarjeta *0746";
  const prompt = buildPrompt({
    rawSms: sms,
    accounts: [],
    categories: [],
  });
  assert.match(prompt, new RegExp(sms.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("incluye remitente desconocido cuando no se provee", () => {
  const prompt = buildPrompt({
    rawSms: "test",
    accounts: [],
    categories: [],
  });
  assert.match(prompt, /desconocido/);
});

test("no revienta cuando no hay cuentas ni categorias", () => {
  const prompt = buildPrompt({
    rawSms: "test",
    accounts: [],
    categories: [],
  });
  assert.match(prompt, /\[\]/);
});

test("pide respuesta JSON con las claves esperadas", () => {
  const prompt = buildPrompt({
    rawSms: "test",
    accounts: [],
    categories: [],
  });
  assert.match(prompt, /"amount"/);
  assert.match(prompt, /"merchant"/);
  assert.match(prompt, /"accountId"/);
  assert.match(prompt, /"categoryId"/);
  assert.match(prompt, /"type"/);
  assert.match(prompt, /"date"/);
  assert.match(prompt, /"ignoreReason"/);
});
