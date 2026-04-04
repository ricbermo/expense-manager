"use client";

import { useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeyPrefix, swrKeys } from "@/lib/swr/keys";
import type { Budget, Category } from "@/lib/types/database";

export interface BudgetWithCategory extends Budget {
  categories: Category;
  spent: number;
}

export function useBudgets(month: string) {
  const { mutate: globalMutate } = useSWRConfig();

  const fetchBudgets = useCallback(async (): Promise<BudgetWithCategory[]> => {
    const supabase = createClient();

    // Fetch budgets with categories
    const { data: budgetData } = await supabase
      .from("budgets")
      .select("*, categories(*)")
      .eq("month", `${month}-01`);

    // Fetch spending per category for this month
    const startDate = `${month}-01`;
    const [y, m] = month.split("-").map(Number);
    const endDate = `${y}-${String(m + 1).padStart(2, "0")}-01`;

    const { data: transactions } = await supabase
      .from("transactions")
      .select("category_id, amount")
      .eq("type", "expense")
      .gte("date", startDate)
      .lt("date", endDate);

    // Calculate spent per category
    const spentMap: Record<string, number> = {};
    (transactions as { category_id: string | null; amount: number }[] ?? []).forEach((t) => {
      if (t.category_id) {
        spentMap[t.category_id] = (spentMap[t.category_id] || 0) + t.amount;
      }
    });

    const enriched = (budgetData ?? []).map((b) => {
      const raw = b as unknown as Budget & { categories: Category };
      return {
        ...raw,
        spent: spentMap[raw.category_id] || 0,
      };
    }) as BudgetWithCategory[];

    return enriched;
  }, [month]);

  const {
    data: budgets = [],
    isLoading: loading,
    mutate,
  } = useSWR(swrKeys.budgets(month), fetchBudgets);

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const revalidateDashboard = useCallback(async () => {
    await globalMutate(
      (key) => Array.isArray(key) && key[0] === swrKeyPrefix.dashboard,
      undefined,
      { revalidate: true }
    );
  }, [globalMutate]);

  const upsertBudget = async (categoryId: string, limitAmount: number) => {
    const supabase = createClient();
    const { error } = await supabase.from("budgets").upsert(
      {
        category_id: categoryId,
        month: `${month}-01`,
        limit_amount: limitAmount,
      } as never,
      { onConflict: "category_id,month" }
    );
    if (error) throw error;
    await mutate();
    await revalidateDashboard();
  };

  const deleteBudget = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) throw error;
    await mutate();
    await revalidateDashboard();
  };

  const copyFromPreviousMonth = async () => {
    const [y, m] = month.split("-").map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

    const supabase = createClient();
    const { data: prevBudgets } = await supabase
      .from("budgets")
      .select("category_id, limit_amount")
      .eq("month", `${prevMonth}-01`);

    if (prevBudgets && prevBudgets.length > 0) {
      const prev = prevBudgets as unknown as { category_id: string; limit_amount: number }[];
      const inserts = prev.map((b) => ({
        category_id: b.category_id,
        month: `${month}-01`,
        limit_amount: b.limit_amount,
      }));
      await supabase
        .from("budgets")
        .upsert(inserts as never[], { onConflict: "category_id,month" });
      await mutate();
      await revalidateDashboard();
    }
  };

  return {
    budgets,
    loading,
    upsertBudget,
    deleteBudget,
    copyFromPreviousMonth,
    refetch,
  };
}
