const FALLBACK_TRANSACTIONS_ERROR =
  "No se pudieron cargar los movimientos. Intenta de nuevo.";

export function getTransactionsErrorMessage(
  error: { message?: string | null } | null | undefined
) {
  const message = error?.message?.trim();
  if (message) {
    return message;
  }

  return FALLBACK_TRANSACTIONS_ERROR;
}
