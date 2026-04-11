"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import type { AccountType } from "@/lib/types/database";
import { swrKeys } from "@/lib/swr/keys";
import { normalizeStoredBalance } from "@/lib/utils/account-balance";

interface CategorySpending {
  name: string;
  color: string;
  amount: number;
}

interface DailySpending {
  date: string;
  amount: number;
}

interface BudgetAlert {
  name: string;
  categoryName: string;
  percentage: number;
  spent: number;
  limit: number;
}

interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
  categorySpending: CategorySpending[];
  dailySpending: DailySpending[];
  prevTotalIncome: number;
  prevTotalExpenses: number;
  topGrowthCategory: { name: string; growth: number } | null;
  budgetAlerts: BudgetAlert[];
}

export function useDashboard(month: string) {
  const defaultData: DashboardData = {
    totalIncome: 0,
    totalExpenses: 0,
    totalBalance: 0,
    categorySpending: [],
    dailySpending: [],
    prevTotalIncome: 0,
    prevTotalExpenses: 0,
    topGrowthCategory: null,
    budgetAlerts: [],
  };

  const fetchDashboard = useCallback(async (): Promise<DashboardData> => {
    const supabase = createClient();
    const startDate = `${month}-01`;
    const [y, m] = month.split("-").map(Number);
    const endDate = `${y}-${String(m + 1).padStart(2, "0")}-01`;

    // Previous month range
    const prevDate = new Date(y, m - 2, 1);
    const prevStartDate = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-01`;
    const prevEndDate = startDate;

    // Fetch current + previous month transactions, accounts, and budgets in parallel
    const [
      { data: transactions },
      { data: prevTransactions },
      { data: accounts },
      { data: budgetData },
    ] = await Promise.all([
      supabase
        .from("transactions")
        .select("*, categories(name, color)")
        .gte("date", startDate)
        .lt("date", endDate),
      supabase
        .from("transactions")
        .select("*, categories(name, color)")
        .gte("date", prevStartDate)
        .lt("date", prevEndDate),
      supabase
        .from("accounts")
        .select("balance, type"),
      supabase
        .from("budgets")
        .select("id, name, limit_amount, category_id, categories(name)")
        .eq("month", startDate),
    ]);

    type TxnRow = {
      id: string;
      amount: number;
      type: string;
      date: string;
      to_account_id: string | null;
      budget_id: string | null;
      category_id: string | null;
      categories: { name: string; color: string } | null;
    };

    const txns = (transactions ?? []) as unknown as TxnRow[];

    let totalIncome = 0;
    let totalExpenses = 0;
    const catMap: Record<string, CategorySpending> = {};
    const dayMap: Record<string, number> = {};

    txns.forEach((t) => {
      if (t.type === "income") {
        if (t.categories?.name !== "Reembolso") {
          totalIncome += t.amount;
        }
      } else if (t.type === "expense") {
        totalExpenses += t.amount;

        if (t.categories) {
          const key = t.categories.name;
          if (!catMap[key]) {
            catMap[key] = {
              name: t.categories.name,
              color: t.categories.color,
              amount: 0,
            };
          }
          catMap[key].amount += t.amount;
        }

        if (!t.to_account_id) {
          dayMap[t.date] = (dayMap[t.date] || 0) + t.amount;
        }
      }
    });

    // Previous month totals
    const prevTxns = (prevTransactions ?? []) as unknown as TxnRow[];
    let prevTotalIncome = 0;
    let prevTotalExpenses = 0;
    const prevCatMap: Record<string, number> = {};

    prevTxns.forEach((t) => {
      if (t.type === "income") {
        if (t.categories?.name !== "Reembolso") {
          prevTotalIncome += t.amount;
        }
      } else if (t.type === "expense") {
        prevTotalExpenses += t.amount;
        if (t.categories) {
          prevCatMap[t.categories.name] = (prevCatMap[t.categories.name] || 0) + t.amount;
        }
      }
    });

    // Find top growth category (biggest increase vs previous month)
    let topGrowthCategory: { name: string; growth: number } | null = null;
    let maxGrowth = 0;
    for (const [name, catData] of Object.entries(catMap)) {
      const prev = prevCatMap[name] || 0;
      const growth = catData.amount - prev;
      if (growth > maxGrowth) {
        maxGrowth = growth;
        topGrowthCategory = { name, growth };
      }
    }

    const totalBalance = (accounts ?? []).reduce(
      (sum, a) => {
        const account = a as unknown as {
          balance: number;
          type: AccountType;
        };
        return sum + normalizeStoredBalance(account.type, account.balance ?? 0);
      },
      0
    );

    const categorySpending = Object.values(catMap).sort(
      (a, b) => b.amount - a.amount
    );

    const dailySpending = Object.entries(dayMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Budget alerts: budgets at >= 80% usage
    type BudgetRow = {
      id: string;
      name: string;
      limit_amount: number;
      category_id: string;
      categories: { name: string } | null;
    };
    const budgets = (budgetData ?? []) as unknown as BudgetRow[];

    // Mirror use-budgets logic: prefer budget_id linkage, fall back to category_id
    // only when exactly one budget owns that category (avoids double-counting).
    const spentByBudgetId: Record<string, number> = {};
    const spentByCategoryId: Record<string, number> = {};
    txns.forEach((t) => {
      if (t.type !== "expense") return;
      if (t.budget_id) {
        spentByBudgetId[t.budget_id] = (spentByBudgetId[t.budget_id] || 0) + t.amount;
      } else if (t.category_id) {
        spentByCategoryId[t.category_id] = (spentByCategoryId[t.category_id] || 0) + t.amount;
      }
    });

    const categoryUsageCount = budgets.reduce<Record<string, number>>((acc, b) => {
      acc[b.category_id] = (acc[b.category_id] ?? 0) + 1;
      return acc;
    }, {});

    const budgetAlerts: BudgetAlert[] = budgets
      .map((b) => {
        const catName = b.categories?.name ?? "";
        const directSpent = spentByBudgetId[b.id] ?? 0;
        const legacySpent = categoryUsageCount[b.category_id] === 1
          ? (spentByCategoryId[b.category_id] ?? 0)
          : 0;
        const spent = directSpent + legacySpent;
        const percentage = b.limit_amount > 0 ? Math.round((spent / b.limit_amount) * 100) : 0;
        return { name: b.name, categoryName: catName, percentage, spent, limit: b.limit_amount };
      })
      .filter((a) => a.percentage >= 80)
      .sort((a, b) => b.percentage - a.percentage);

    return {
      totalIncome,
      totalExpenses,
      totalBalance,
      categorySpending,
      dailySpending,
      prevTotalIncome,
      prevTotalExpenses,
      topGrowthCategory,
      budgetAlerts,
    };
  }, [month]);

  const {
    data = defaultData,
    isLoading: loading,
    mutate,
  } = useSWR(swrKeys.dashboard(month), fetchDashboard);

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return { data, loading, refetch };
}
