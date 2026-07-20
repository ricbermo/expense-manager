import { NextResponse } from "next/server";
import { createAdminClient, getAdminUserId } from "@/lib/supabase/admin";
import { parseSms } from "@/lib/sms/parse-sms";
import type { Account, Category } from "@/lib/types/database";

export const dynamic = "force-dynamic";

interface SmsRequestBody {
  rawSms?: unknown;
  sender?: unknown;
}

function getShortcutAuthDiagnostics(request: Request): {
  ok: boolean;
  envSet: boolean;
  headerPrefix: string;
  headerPresent: boolean;
} {
  const shortcutApiKey = process.env.SHORTCUT_API_KEY;
  if (!shortcutApiKey) {
    return { ok: false, envSet: false, headerPrefix: "", headerPresent: false };
  }

  const header = request.headers.get("authorization") ?? "";
  const headerPresent = header.length > 0;
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  const ok = token.length > 0 && token === shortcutApiKey;
  return {
    ok,
    envSet: true,
    headerPrefix: headerPresent ? header.slice(0, 20) + "..." : "(missing)",
    headerPresent,
  };
}

function ensureShortcutAuth(request: Request): boolean {
  const shortcutApiKey = process.env.SHORTCUT_API_KEY;
  if (!shortcutApiKey) return false;

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  return token.length > 0 && token === shortcutApiKey;
}

export async function POST(request: Request) {
  if (!ensureShortcutAuth(request)) {
    const diag = getShortcutAuthDiagnostics(request);
    return NextResponse.json(
      { error: "Unauthorized", diagnostics: diag },
      { status: 401 }
    );
  }

  let body: SmsRequestBody;
  try {
    body = (await request.json()) as SmsRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawSms = typeof body.rawSms === "string" ? body.rawSms.trim() : "";
  const sender = typeof body.sender === "string" ? body.sender.trim() : undefined;

  if (!rawSms) {
    return NextResponse.json({ error: "rawSms is required" }, { status: 400 });
  }

  let adminClient: ReturnType<typeof createAdminClient>;
  try {
    adminClient = createAdminClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Missing admin env vars";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const userId = await getAdminUserId(adminClient);
  if (!userId) {
    return NextResponse.json({ error: "Could not resolve user from database" }, { status: 500 });
  }

  const [accountsRes, expenseCategoriesRes] = await Promise.all([
    adminClient.from("accounts").select("id, name, type").limit(50),
    adminClient.from("categories").select("id, name").eq("type", "expense").limit(50),
  ]);

  if (accountsRes.error || expenseCategoriesRes.error) {
    const message = accountsRes.error?.message ?? expenseCategoriesRes.error?.message ?? "DB error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const accounts = (accountsRes.data ?? []) as Pick<Account, "id" | "name" | "type">[];
  const categories = (expenseCategoriesRes.data ?? []) as Pick<Category, "id" | "name">[];

  let parsed;
  try {
    parsed = await parseSms({
      rawSms,
      sender,
      accounts: accounts.map((a) => ({ id: a.id, name: a.name, type: a.type })),
      categories: categories.map((c) => ({ id: c.id, name: c.name })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gemini parse failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (parsed.ignoreReason === "internal_transfer") {
    return NextResponse.json({ ignored: true, reason: parsed.ignoreReason });
  }

  if (!parsed.amount || parsed.amount <= 0) {
    return NextResponse.json(
      { error: "Could not determine amount from SMS", parsed },
      { status: 422 }
    );
  }

  if (!parsed.type) {
    return NextResponse.json(
      { error: "Could not determine transaction type", parsed },
      { status: 422 }
    );
  }

  const accountId = parsed.accountId ?? accounts[0]?.id ?? null;
  if (!accountId) {
    return NextResponse.json(
      { error: "User has no accounts configured", parsed },
      { status: 422 }
    );
  }

  const installments = null;
  const insertPayload = {
    user_id: userId,
    amount: parsed.amount,
    type: parsed.type,
    description: parsed.description ?? parsed.merchant,
    date: parsed.date ?? new Date().toISOString().slice(0, 10),
    category_id: parsed.categoryId,
    budget_id: null,
    related_expense_id: null,
    account_id: accountId,
    to_account_id: null,
    installments,
    is_occasional: false,
    status: "pending" as const,
  };

  const { data: inserted, error: insertError } = await adminClient
    .from("transactions")
    .insert(insertPayload as never)
    .select("id, amount, description, date, account_id")
    .single();

  if (insertError || !inserted) {
    const message = insertError?.message ?? "Insert failed";
    return NextResponse.json({ error: message, parsed }, { status: 500 });
  }

  const insertedRow = inserted as {
    id: string;
    amount: number;
    description: string | null;
    date: string;
    account_id: string;
  };

  const accountMatch = accounts.find((a) => a.id === insertedRow.account_id);
  const accountName = accountMatch?.name ?? null;

  return NextResponse.json({
    id: insertedRow.id,
    amount: insertedRow.amount,
    merchant: parsed.merchant,
    description: insertedRow.description,
    date: insertedRow.date,
    accountName,
    status: "pending",
  });
}