import type { TransactionType } from "@/lib/types/database";

export function isDestinationRequired(_type: TransactionType): boolean {
  void _type;
  return false;
}

export function isDestinationSelectionValid(
  type: TransactionType,
  accountId: string,
  toAccountId: string,
): boolean {
  if (type !== "transfer" && type !== "expense") {
    return true;
  }

  if (!toAccountId) {
    return true;
  }

  return toAccountId !== accountId;
}
