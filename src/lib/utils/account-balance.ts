import type { AccountType } from "@/lib/types/database";

function isLiabilityAccount(type: AccountType) {
  return type === "credit_card" || type === "loan";
}

export function normalizeStoredBalance(type: AccountType, balance: number) {
  if (isLiabilityAccount(type)) {
    return -Math.abs(balance);
  }

  return balance;
}

export function toBalanceFieldValue(type: AccountType, balance: number) {
  if (isLiabilityAccount(type)) {
    return Math.abs(balance);
  }

  return balance;
}
