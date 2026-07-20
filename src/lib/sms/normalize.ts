import type { ParsedSms } from "./types";

const VALID_TRANSACTION_TYPES = new Set(["expense", "income", "transfer"]);
const IGNORE_REASONS = ["internal_transfer"] as const;
type IgnoreReason = (typeof IGNORE_REASONS)[number];

function isIgnoreReason(value: unknown): value is IgnoreReason {
  return typeof value === "string" && (IGNORE_REASONS as readonly string[]).includes(value);
}

export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function normalizeParsed(raw: unknown, fallbackDate: string): ParsedSms {
  if (typeof raw !== "object" || raw === null) {
    return {
      amount: null,
      merchant: null,
      accountId: null,
      categoryId: null,
      type: null,
      date: null,
      description: null,
      ignoreReason: null,
    };
  }

  const obj = raw as Record<string, unknown>;
  const rawType = obj.type;
  const type =
    typeof rawType === "string" && VALID_TRANSACTION_TYPES.has(rawType)
      ? (rawType as ParsedSms["type"])
      : null;

  const rawDate = obj.date;
  const date = isIsoDate(rawDate) ? rawDate : fallbackDate;

  const ignoreReasonRaw = obj.ignoreReason;
  const ignoreReason = isIgnoreReason(ignoreReasonRaw) ? ignoreReasonRaw : null;

  const amount =
    typeof obj.amount === "number" && Number.isFinite(obj.amount) && obj.amount >= 0
      ? Math.round(obj.amount)
      : null;

  const merchant = typeof obj.merchant === "string" && obj.merchant.trim() ? obj.merchant.trim() : null;
  const description =
    typeof obj.description === "string" && obj.description.trim() ? obj.description.trim() : null;

  const accountId = typeof obj.accountId === "string" && obj.accountId.trim() ? obj.accountId.trim() : null;
  const categoryId = typeof obj.categoryId === "string" && obj.categoryId.trim() ? obj.categoryId.trim() : null;

  return { amount, merchant, accountId, categoryId, type, date, description, ignoreReason };
}