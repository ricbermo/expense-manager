import { callGemini } from "./gemini-client";
import { normalizeParsed, todayIso } from "./normalize";
import { buildPrompt } from "./prompt";
import type { AccountContext, CategoryContext, ParsedSms } from "./types";

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    amount: { type: "INTEGER", nullable: true },
    merchant: { type: "STRING", nullable: true },
    accountId: { type: "STRING", nullable: true },
    categoryId: { type: "STRING", nullable: true },
    type: { type: "STRING", enum: ["expense", "income", "transfer"] },
    date: { type: "STRING" },
    description: { type: "STRING", nullable: true },
    ignoreReason: {
      type: "STRING",
      enum: ["internal_transfer"],
      nullable: true,
    },
  },
  required: ["type", "date", "ignoreReason"],
} as const;

export interface ParseOptions {
  apiKey?: string;
  fetchImpl?: typeof fetch;
  today?: () => string;
}

export async function parseSms(
  input: {
    rawSms: string;
    sender?: string;
    accounts: AccountContext[];
    categories: CategoryContext[];
  },
  options: ParseOptions = {},
): Promise<ParsedSms> {
  const prompt = buildPrompt({
    rawSms: input.rawSms,
    sender: input.sender,
    accounts: input.accounts,
    categories: input.categories,
  });

  const todayFn = options.today ?? todayIso;

  const rawText = await callGemini(prompt, RESPONSE_SCHEMA, {
    apiKey: options.apiKey,
    fetchImpl: options.fetchImpl,
    temperature: 0,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = null;
  }

  return normalizeParsed(parsed, todayFn());
}
