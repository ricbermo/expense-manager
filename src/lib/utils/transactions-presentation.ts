export const TRANSACTION_SEARCH_EMPTY_MESSAGE =
  "Intenta con otro filtro o búsqueda";

export function getTransactionDeleteLabels() {
  return {
    confirm: "Eliminar movimiento",
    cancel: "Cancelar",
  } as const;
}

export function shouldHandleNewTransactionShortcut(event: {
  key: string;
  target: { tagName?: string | null } | EventTarget | null;
}) {
  if (event.key.toLowerCase() !== "n") return false;

  const tagName =
    event.target &&
    "tagName" in event.target &&
    typeof event.target.tagName === "string"
      ? event.target.tagName.toUpperCase()
      : undefined;
  return tagName !== "INPUT" && tagName !== "TEXTAREA" && tagName !== "SELECT";
}
