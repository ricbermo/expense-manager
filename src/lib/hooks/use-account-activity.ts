"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";

export interface AccountActivity {
  income: number;
  expense: number;
}

export function useAccountActivity(month: string) {
  const fetchActivity = useCallback(async (): Promise<
    Record<string, AccountActivity>
  > => {
    const supabase = createClient();
    const startDate = `${month}-01`;
    const [y, m] = month.split("-").map(Number);
    const endDate = `${y}-${String(m + 1).padStart(2, "0")}-01`;

    const [{ data }, { data: accountsData }] = await Promise.all([
      supabase
        .from("transactions")
        .select("account_id, to_account_id, type, amount")
        .gte("date", startDate)
        .lt("date", endDate)
        .in("type", ["income", "expense"]),
      supabase.from("accounts").select("id, type").is("archived_at", null),
    ]);

    const creditCardAccountIds = new Set(
      ((accountsData ?? []) as { id: string; type: string }[])
        .filter((a) => a.type === "credit_card")
        .map((a) => a.id),
    );

    const result: Record<string, AccountActivity> = {};
    for (const t of (data ?? []) as {
      account_id: string;
      to_account_id: string | null;
      type: string;
      amount: number;
    }[]) {
      if (!result[t.account_id])
        result[t.account_id] = { income: 0, expense: 0 };
      if (t.type === "income") result[t.account_id].income += t.amount;
      else if (t.type === "expense") {
        if (t.to_account_id && creditCardAccountIds.has(t.to_account_id))
          continue;
        result[t.account_id].expense += t.amount;
      }
    }
    return result;
  }, [month]);

  const { data: activity = {}, isLoading: loading } = useSWR(
    swrKeys.accountActivity(month),
    fetchActivity,
  );

  return { activity, loading };
}
