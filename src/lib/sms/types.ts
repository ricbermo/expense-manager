import type { TransactionType } from "@/lib/types/database";

export interface AccountContext {
  id: string;
  name: string;
  type: string;
}

export interface CategoryContext {
  id: string;
  name: string;
}

export interface SmsParseInput {
  rawSms: string;
  sender?: string;
  accounts: AccountContext[];
  categories: CategoryContext[];
}

export interface ParsedSms {
  amount: number | null;
  merchant: string | null;
  accountId: string | null;
  categoryId: string | null;
  type: TransactionType | null;
  date: string | null;
  description: string | null;
  ignoreReason: "internal_transfer" | null;
}

export const IGNORE_REASONS = ["internal_transfer"] as const;
export type IgnoreReason = (typeof IGNORE_REASONS)[number];

export function isIgnoreReason(value: unknown): value is IgnoreReason {
  return (
    typeof value === "string" &&
    (IGNORE_REASONS as readonly string[]).includes(value)
  );
}
