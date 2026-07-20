"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { createClient } from "@/lib/supabase/client";

export interface ResetMonthResult {
  deletedTransactions: number;
  deletedBudgets: number;
}

export function useResetMonth() {
  const { mutate: globalMutate } = useSWRConfig();
  const [resetting, setResetting] = useState(false);

  const resetMonth = async (month: string): Promise<ResetMonthResult> => {
    setResetting(true);
    try {
      const supabase = createClient();
      const startDate = `${month}-01`;
      const [y, m] = month.split("-").map(Number);
      const endDate = `${y}-${String(m + 1).padStart(2, "0")}-01`;

      const [txResult, budgetResult] = await Promise.all([
        supabase
          .from("transactions")
          .delete({ count: "exact" })
          .gte("date", startDate)
          .lt("date", endDate),
        supabase
          .from("budgets")
          .delete({ count: "exact" })
          .eq("month", startDate),
      ]);

      if (txResult.error) throw txResult.error;
      if (budgetResult.error) throw budgetResult.error;

      await globalMutate(() => true, undefined, { revalidate: true });

      return {
        deletedTransactions: txResult.count ?? 0,
        deletedBudgets: budgetResult.count ?? 0,
      };
    } finally {
      setResetting(false);
    }
  };

  return { resetMonth, resetting };
}