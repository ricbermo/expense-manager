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

interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
  categorySpending: CategorySpending[];
  dailySpending: DailySpending[];
}

export function useDashboard(month: string) {
  const defaultData: DashboardData = {
    totalIncome: 0,
    totalExpenses: 0,
    totalBalance: 0,
    categorySpending: [],
    dailySpending: [],
  };

  const fetchDashboard = useCallback(async (): Promise<DashboardData> => {
    const supabase = createClient();
    const startDate = `${month}-01`;
    const [y, m] = month.split("-").map(Number);
    const endDate = `${y}-${String(m + 1).padStart(2, "0")}-01`;

    // Fetch all transactions for the month
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*, categories(name, color)")
      .gte("date", startDate)
      .lt("date", endDate);

    // Fetch all account balances
    const { data: accounts } = await supabase
      .from("accounts")
      .select("balance, type");

    const txns = (transactions ?? []) as unknown as {
      amount: number;
      type: string;
      date: string;
      to_account_id: string | null;
      categories: { name: string; color: string } | null;
    }[];

    let totalIncome = 0;
    let totalExpenses = 0;
    const catMap: Record<string, CategorySpending> = {};
    const dayMap: Record<string, number> = {};

    txns.forEach((t) => {
      if (t.type === "income") {
        // Exclude reimbursements from income total
        if (t.categories?.name !== "Reembolso") {
          totalIncome += t.amount;
        }
      } else if (t.type === "expense") {
        totalExpenses += t.amount;

        // Category spending
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

        // Daily spending (exclude internal payments like credit card payments)
        if (!t.to_account_id) {
          dayMap[t.date] = (dayMap[t.date] || 0) + t.amount;
        }
      }
    });

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

    return {
      totalIncome,
      totalExpenses,
      totalBalance,
      categorySpending,
      dailySpending,
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
