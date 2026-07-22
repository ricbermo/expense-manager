const FALLBACK_TRANSACTIONS_ERROR =
  "No se pudieron cargar los movimientos. Intenta de nuevo.";

export function getTransactionsErrorMessage(
  error: { message?: string | null } | null | undefined,
) {
  const message = error?.message?.trim();
  if (message?.toLowerCase().includes("destination account")) {
    return "La cuenta destino no está disponible. Elige otra e inténtalo de nuevo.";
  }

  return FALLBACK_TRANSACTIONS_ERROR;
}
