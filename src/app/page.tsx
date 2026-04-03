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
    <div className="pb-6">
      <PageHeader
        title="Dashboard"
        description="Resumen mensual de ingresos, gastos y balance"
      />

      <div className="app-shell page-stack">
        <div className="month-toolbar">
          <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <p className="text-sm font-semibold capitalize text-foreground">
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
                className="section-card h-24 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="kpi-card">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Ingresos
                </p>
                <p className="mt-1 text-xl font-semibold text-emerald-600">
                  {formatCOP(data.totalIncome)}
                </p>
              </div>
              <div className="kpi-card">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Gastos
                </p>
                <p className="mt-1 text-xl font-semibold text-rose-600">
                  {formatCOP(data.totalExpenses)}
                </p>
              </div>
              <div className="kpi-card">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Neto
                </p>
                <p
                  className={`mt-1 text-xl font-semibold ${net >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                >
                  {formatCOP(net)}
                </p>
              </div>
              <div className="kpi-card">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Balance total
                </p>
                <p
                  className={`mt-1 text-xl font-semibold ${data.totalBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}
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
