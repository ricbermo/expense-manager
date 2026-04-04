type BuildTransactionMetaLineInput = {
  typeLabel: string;
  accountName: string;
  budgetName: string | null;
};

export function buildTransactionMetaLine({
  typeLabel,
  accountName,
  budgetName,
}: BuildTransactionMetaLineInput): string {
  if (!budgetName) {
    return `${typeLabel} · ${accountName}`;
  }

  return `${typeLabel} · ${accountName} · Presupuesto: ${budgetName}`;
}
