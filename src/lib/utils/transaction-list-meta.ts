import type { TransactionType } from "@/lib/types/database";

type BuildTransactionMetaLineInput = {
  type: TransactionType;
  accountName: string;
  destinationAccountName: string | null;
  budgetName: string | null;
};

export function getTransactionAmountPrefix(type: TransactionType): string {
  if (type === "income") return "+";
  if (type === "expense") return "-";
  return "";
}

export function buildTransactionMetaLine({
  type,
  accountName,
  destinationAccountName,
  budgetName,
}: BuildTransactionMetaLineInput): string {
  if (type === "transfer") {
    return destinationAccountName
      ? `Transferencia · ${accountName} → ${destinationAccountName}`
      : `Transferencia · ${accountName}`;
  }

  const label = type === "income" ? "Ingreso" : "Gasto";

  if (!budgetName) {
    return `${label} · ${accountName}`;
  }

  return `${label} · ${accountName} · Presupuesto: ${budgetName}`;
}
