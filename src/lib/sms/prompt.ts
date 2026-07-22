import type { AccountContext, CategoryContext, SmsParseInput } from "./types";

function formatAccounts(accounts: AccountContext[]): string {
  if (accounts.length === 0) return "[]";
  const lines = accounts.map(
    (a) => `  { "id": "${a.id}", "name": "${a.name}", "type": "${a.type}" }`,
  );
  return `[\n${lines.join(",\n")}\n]`;
}

function formatCategories(categories: CategoryContext[]): string {
  if (categories.length === 0) return "[]";
  const lines = categories.map(
    (c) => `  { "id": "${c.id}", "name": "${c.name}" }`,
  );
  return `[\n${lines.join(",\n")}\n]`;
}

export function buildPrompt(input: SmsParseInput): string {
  return `Estas procesando un SMS bancario colombiano para registrar un movimiento financiero.

Cuentas del usuario:
${formatAccounts(input.accounts)}

Categorias de gasto del usuario:
${formatCategories(input.categories)}

Remitente detectado: ${input.sender ?? "desconocido"}

SMS a procesar:
"""
${input.rawSms}
"""

Responde SOLO con este JSON, sin texto adicional, sin markdown:
{
  "amount": <numero en COP sin separadores ni decimales>,
  "merchant": "<nombre del comercio o null>",
  "accountId": "<UUID de la cuenta del usuario que coincida o null>",
  "categoryId": "<UUID de la categoria que mejor encaje o null>",
  "type": "expense" | "income" | "transfer",
  "date": "YYYY-MM-DD",
  "description": "<descripcion corta legible o null>",
  "ignoreReason": null | "internal_transfer"
}

Reglas de tipo:
- Expense (default): cualquier salida de dinero para pagar algo o enviar a un tercero. Incluye: compras, pagos con PSE, retiros, transfers a terceros (ej: "Transferencia a una llave"), pago de servicios.
- Income: abonos, salario, reembolsos, ingresos recibidos.
- Transfer: NUNCA usar este tipo. Las transferencias entre cuentas propias del usuario se marcan como ignoreReason: "internal_transfer" (abajo) y no se registran.

Reglas adicionales:
- Transferencias internas entre cuentas propias (ej: "Bolsillo a Cuenta", entre cuentas propias) -> ignoreReason: "internal_transfer", amount: 0.
- Si no puedes determinar la cuenta, accountId: null.
- Si no puedes determinar la categoria, categoryId: null.
- Monto en COP, siempre entero sin decimales, sin separadores de miles (ej: 75000, no "75,000" ni "75.000").
- date: usa la fecha del SMS si esta explicita, si no usa la fecha de hoy.
- Si el SMS no parece un movimiento financiero valido -> ignoreReason: "internal_transfer" con amount: 0.`;
}
