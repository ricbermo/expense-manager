"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { SpendingByCategory } from "@/components/dashboard/spending-by-category";
import { MonthlyTrend } from "@/components/dashboard/monthly-trend";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { formatCOP } from "@/lib/utils/currency";
import { formatMonthYear } from "@/lib/utils/dates";

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const [month, setMonth] = useState(getCurrentMonth);
  const { data, loading } = useDashboard(month);

  const changeMonth = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const net = data.totalIncome - data.totalExpenses;

  return (
    <div>
      <PageHeader title="Dashboard" />

      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <p className="text-sm font-medium capitalize">
            {formatMonthYear(`${month}-01`)}
          </p>
          <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-card animate-pulse border border-border"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-card p-4 border border-border">
                <p className="text-xs text-muted-foreground">Ingresos</p>
                <p className="text-lg font-bold text-emerald-500">
                  {formatCOP(data.totalIncome)}
                </p>
              </div>
              <div className="rounded-xl bg-card p-4 border border-border">
                <p className="text-xs text-muted-foreground">Gastos</p>
                <p className="text-lg font-bold text-rose-500">
                  {formatCOP(data.totalExpenses)}
                </p>
              </div>
              <div className="rounded-xl bg-card p-4 border border-border">
                <p className="text-xs text-muted-foreground">Neto</p>
                <p
                  className={`text-lg font-bold ${net >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                >
                  {formatCOP(net)}
                </p>
              </div>
              <div className="rounded-xl bg-card p-4 border border-border">
                <p className="text-xs text-muted-foreground">Balance total</p>
                <p
                  className={`text-lg font-bold ${data.totalBalance >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                >
                  {formatCOP(data.totalBalance)}
                </p>
              </div>
            </div>

            <SpendingByCategory data={data.categorySpending} />
            <MonthlyTrend data={data.dailySpending} />
          </>
        )}
      </div>
    </div>
  );
}
