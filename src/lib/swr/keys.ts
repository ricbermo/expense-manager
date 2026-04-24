import type { CategoryType } from "@/lib/types/database";

export const swrKeyPrefix = {
  accounts: "accounts",
  budgets: "budgets",
  categories: "categories",
  dashboard: "dashboard",
  transactions: "transactions",
  creditCardStatements: "credit-card-statements",
} as const;

export const swrKeys = {
  accounts: [swrKeyPrefix.accounts] as const,
  accountActivity: (month: string) => [swrKeyPrefix.accounts, "activity", month] as const,
  budgets: (month: string) => [swrKeyPrefix.budgets, month] as const,
  categories: (type?: CategoryType) => [swrKeyPrefix.categories, type ?? "all"] as const,
  dashboard: (month: string) => [swrKeyPrefix.dashboard, month] as const,
  monthlyComparison: () => [swrKeyPrefix.dashboard, "monthly-comparison"] as const,
  transactions: (month?: string) => [swrKeyPrefix.transactions, month ?? "all"] as const,
  creditCardStatements: [swrKeyPrefix.creditCardStatements] as const,
};
