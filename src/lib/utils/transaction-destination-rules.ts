import type { TransactionType } from "@/lib/types/database";

export function isDestinationRequired(type: TransactionType): boolean {
  switch (type) {
    case "transfer":
    case "payment":
    case "expense":
    case "income":
    default:
      return false;
  }
}

export function isDestinationSelectionValid(
  type: TransactionType,
  accountId: string,
  toAccountId: string
): boolean {
  if (type !== "transfer" && type !== "payment") {
    return true;
  }

  if (!toAccountId) {
    return true;
  }

  return toAccountId !== accountId;
}
