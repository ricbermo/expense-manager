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

interface SaveBudgetInput {
  name: string;
  categoryId: string;
  limitAmount: number;
}

function mapBudgetError(error: { code?: string; message?: string } | null): Error | null {
  if (!error) {
    return null;
  }

  if (error.code === "23505") {
    return new Error("Ya existe un presupuesto con ese nombre para este mes.");
  }

  return new Error(error.message ?? "No se pudo guardar el presupuesto.");
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
      .select("category_id, budget_id, amount")
      .eq("type", "expense")
      .gte("date", startDate)
      .lt("date", endDate);

    // Calculate spent per budget (preferred) and by category (legacy fallback)
    const spentByBudgetMap: Record<string, number> = {};
    const spentByCategoryMap: Record<string, number> = {};
    (
      transactions as {
        category_id: string | null;
        budget_id: string | null;
        amount: number;
      }[] ?? []
    ).forEach((t) => {
      if (t.budget_id) {
        spentByBudgetMap[t.budget_id] = (spentByBudgetMap[t.budget_id] || 0) + t.amount;
        return;
      }

      if (t.category_id) {
        spentByCategoryMap[t.category_id] = (spentByCategoryMap[t.category_id] || 0) + t.amount;
      }
    });

    const categoryUsageCount = (budgetData ?? []).reduce<Record<string, number>>((acc, b) => {
      const row = b as unknown as Budget;
      acc[row.category_id] = (acc[row.category_id] ?? 0) + 1;
      return acc;
    }, {});

    const enriched = (budgetData ?? []).map((b) => {
      const raw = b as unknown as Budget & { categories: Category };
      const directSpent = spentByBudgetMap[raw.id] ?? 0;
      const canApplyLegacyCategorySpent = categoryUsageCount[raw.category_id] === 1;
      const legacyCategorySpent = canApplyLegacyCategorySpent
        ? spentByCategoryMap[raw.category_id] ?? 0
        : 0;

      return {
        ...raw,
        spent: directSpent + legacyCategorySpent,
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

  const createBudget = async ({ name, categoryId, limitAmount }: SaveBudgetInput) => {
    const supabase = createClient();
    const { error } = await supabase.from("budgets").insert(
      {
        name: name.trim(),
        category_id: categoryId,
        month: `${month}-01`,
        limit_amount: limitAmount,
      } as never
    );
    const mappedError = mapBudgetError(error);
    if (mappedError) throw mappedError;
    await mutate();
    await revalidateDashboard();
  };

  const updateBudget = async ({
    id,
    name,
    categoryId,
    limitAmount,
  }: SaveBudgetInput & { id: string }) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("budgets")
      .update({
        name: name.trim(),
        category_id: categoryId,
        limit_amount: limitAmount,
      } as never)
      .eq("id", id);

    const mappedError = mapBudgetError(error);
    if (mappedError) throw mappedError;
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
      .select("name, category_id, limit_amount")
      .eq("month", `${prevMonth}-01`);

    if (prevBudgets && prevBudgets.length > 0) {
      const prev = prevBudgets as unknown as {
        name: string;
        category_id: string;
        limit_amount: number;
      }[];

      const { data: currentBudgets } = await supabase
        .from("budgets")
        .select("name")
        .eq("month", `${month}-01`);

      const existingNames = new Set(
        (currentBudgets as { name: string }[] | null)?.map((b) =>
          b.name.trim().toLowerCase()
        ) ?? []
      );

      const inserts = prev.map((b) => ({
        name: b.name,
        category_id: b.category_id,
        month: `${month}-01`,
        limit_amount: b.limit_amount,
      }))
        .filter((b) => {
          const normalized = b.name.trim().toLowerCase();
          if (existingNames.has(normalized)) {
            return false;
          }
          existingNames.add(normalized);
          return true;
        });

      if (inserts.length > 0) {
        const { error } = await supabase.from("budgets").insert(inserts as never[]);
        const mappedError = mapBudgetError(error);
        if (mappedError) throw mappedError;
        await mutate();
        await revalidateDashboard();
      }
    }
  };

  return {
    budgets,
    loading,
    createBudget,
    updateBudget,
    deleteBudget,
    copyFromPreviousMonth,
    refetch,
  };
}
