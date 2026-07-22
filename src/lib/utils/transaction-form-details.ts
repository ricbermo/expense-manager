import type { TransactionType } from "@/lib/types/database";

export interface TransactionFormDetailsInput {
  type: TransactionType;
  budget_id?: string | null;
  category_id?: string | null;
  description?: string | null;
  tags?: readonly string[] | null;
  to_account_id?: string | null;
  installments?: number | null;
  is_occasional?: boolean | null;
  is_debt_payment?: boolean | null;
  is_shared_expense?: boolean | null;
}

/**
 * Determines whether the advanced section should be open when a transaction
 * is loaded for editing. Empty/default values keep the common path compact.
 */
export function shouldShowTransactionDetails({
  type,
  budget_id,
  category_id,
  description,
  tags,
  to_account_id,
  installments,
  is_occasional,
  is_debt_payment,
  is_shared_expense,
}: TransactionFormDetailsInput): boolean {
  const hasDescription = Boolean(description?.trim());
  const hasTags = Boolean(tags?.some((tag) => tag.trim()));
  const hasInstallments = Number(installments ?? 1) > 1;

  if (type === "expense") {
    return Boolean(
      budget_id ||
        category_id ||
        hasDescription ||
        hasTags ||
        to_account_id ||
        hasInstallments ||
        is_occasional ||
        is_debt_payment ||
        is_shared_expense,
    );
  }

  if (type === "income") {
    return Boolean(category_id || hasDescription || hasTags);
  }

  return Boolean(to_account_id || hasDescription || hasTags);
}
