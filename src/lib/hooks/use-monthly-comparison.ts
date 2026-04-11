"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";

export interface MonthComparison {
  month: string;
  label: string;
  income: number;
  expenses: number;
}

function getTrailing6Months(): { start: string; end: string; months: string[] } {
  const now = new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }
  const start = `${months[0]}-01`;
  const [y, m] = months[months.length - 1].split("-").map(Number);
  const end = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return { start, end, months };
}

function shortMonthLabel(yyyyMM: string): string {
  const [y, m] = yyyyMM.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", { month: "short" }).format(
    new Date(y, m - 1, 1)
  );
}

export function useMonthlyComparison() {
  const fetchComparison = useCallback(async (): Promise<MonthComparison[]> => {
    const supabase = createClient();
    const { start, end, months } = getTrailing6Months();

    const { data } = await supabase
      .from("transactions")
      .select("date, type, amount, categories(name)")
      .gte("date", start)
      .lt("date", end)
      .in("type", ["income", "expense"]);

    const totals: Record<string, { income: number; expenses: number }> = {};
    for (const mo of months) totals[mo] = { income: 0, expenses: 0 };

    type Row = { date: string; type: string; amount: number; categories: { name: string } | null };
    for (const t of (data ?? []) as unknown as Row[]) {
      const mo = t.date.slice(0, 7);
      if (!totals[mo]) continue;
      if (t.type === "income" && t.categories?.name !== "Reembolso") {
        totals[mo].income += t.amount;
      } else if (t.type === "expense") {
        totals[mo].expenses += t.amount;
      }
    }

    return months.map((mo) => ({
      month: mo,
      label: shortMonthLabel(mo),
      income: totals[mo].income,
      expenses: totals[mo].expenses,
    }));
  }, []);

  const { data: comparison = [], isLoading: loading } = useSWR(
    swrKeys.monthlyComparison(),
    fetchComparison
  );

  return { comparison, loading };
}
