"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, AlertTriangle, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { SpendingByCategory } from "@/components/dashboard/spending-by-category";
import { IncomeByCategory } from "@/components/dashboard/income-by-category";
import { MonthlyTrend } from "@/components/dashboard/monthly-trend";
import { MonthlyComparison } from "@/components/dashboard/monthly-comparison";
import { SavingsRateCard } from "@/components/dashboard/savings-rate-card";
import { ExpenseProjectionCard } from "@/components/dashboard/expense-projection-card";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { formatCOP } from "@/lib/utils/currency";
import { formatMonthYear } from "@/lib/utils/dates";
import type { CreditCardAlert } from "@/lib/hooks/use-dashboard";

function KpiChange({ current, previous, invertColor = false }: { current: number; previous: number; invertColor?: boolean }) {
  if (previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return null;
  const isUp = pct > 0;
  // For expenses, up is bad (rose). For income, up is good (emerald). invertColor flips this.
  const isPositive = invertColor ? !isUp : isUp;
  const Icon = isUp ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(pct)}%
    </span>
  );
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const [month, setMonth] = useState(getCurrentMonth);
  const { data, loading } = useDashboard(month);
  const router = useRouter();

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
          <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} aria-label="Mes anterior">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <p className="text-sm font-semibold capitalize text-foreground">
            {formatMonthYear(`${month}-01`)}
          </p>
          <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} aria-label="Mes siguiente">
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
              <button
                className="kpi-card text-left transition-colors hover:border-primary/30 cursor-pointer"
                onClick={() => router.push("/transactions")}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Ingresos
                  </p>
                  <KpiChange current={data.totalIncome} previous={data.prevTotalIncome} />
                </div>
                <p className="mt-1 text-xl font-semibold text-emerald-600">
                  {formatCOP(data.totalIncome)}
                </p>
              </button>
              <button
                className="kpi-card text-left transition-colors hover:border-primary/30 cursor-pointer"
                onClick={() => router.push("/transactions")}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Gastos
                  </p>
                  <KpiChange current={data.totalExpenses} previous={data.prevTotalExpenses} invertColor />
                </div>
                <p className="mt-1 text-xl font-semibold text-rose-600">
                  {formatCOP(data.totalExpenses)}
                </p>
              </button>
              <button
                className="kpi-card text-left transition-colors hover:border-primary/30 cursor-pointer"
                onClick={() => router.push("/transactions")}
              >
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Neto
                </p>
                <p
                  className={`mt-1 text-xl font-semibold ${net >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                >
                  {formatCOP(net)}
                </p>
              </button>
              <button
                className="kpi-card text-left transition-colors hover:border-primary/30 cursor-pointer"
                onClick={() => router.push("/accounts")}
              >
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Balance total
                </p>
                <p
                  className={`mt-1 text-xl font-semibold ${data.totalBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                >
                  {formatCOP(data.totalBalance)}
                </p>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SavingsRateCard
                month={month}
                income={data.totalIncome}
                expenses={data.totalExpenses}
              />
              <ExpenseProjectionCard
                month={month}
                expensesMTD={data.totalExpenses}
              />
            </div>

            {data.topGrowthCategory && (
              <div className="section-card flex items-center gap-3 p-3">
                <TrendingUp className="h-4 w-4 text-rose-600 shrink-0" />
                <p className="text-sm">
                  <span className="font-semibold">{data.topGrowthCategory.name}</span>
                  {" "}aumento{" "}
                  <span className="font-semibold text-rose-600">
                    {formatCOP(data.topGrowthCategory.growth)}
                  </span>
                  {" "}vs mes anterior
                </p>
              </div>
            )}

            {data.creditCardAlerts.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground px-1">Pagos de tarjeta pendientes</p>
                {data.creditCardAlerts.map((alert: CreditCardAlert) => {
                  const overdue = alert.daysUntilDue < 0;
                  const urgent = alert.daysUntilDue <= 7;
                  const color = overdue ? "text-rose-600" : urgent ? "text-amber-500" : "text-blue-600";
                  const label = overdue
                    ? `Vencida hace ${Math.abs(alert.daysUntilDue)} días`
                    : alert.daysUntilDue === 0
                      ? "Vence hoy"
                      : `Vence en ${alert.daysUntilDue} días`;
                  return (
                    <button
                      key={alert.id}
                      className="section-card flex items-center gap-3 p-3 w-full text-left transition-colors hover:border-primary/30 cursor-pointer"
                      onClick={() => router.push("/accounts")}
                    >
                      <CreditCard className={`h-4 w-4 shrink-0 ${color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{alert.accountName}</p>
                        <p className={`text-xs ${color}`}>{label}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold tabular-nums ${color}`}>
                          {formatCOP(alert.minimumPayment)}
                        </p>
                        <p className="text-xs text-muted-foreground">pago mínimo</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {data.budgetAlerts.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground px-1">Presupuestos en alerta</p>
                {data.budgetAlerts.map((alert) => (
                  <button
                    key={alert.name}
                    className="section-card flex items-center gap-3 p-3 w-full text-left transition-colors hover:border-primary/30 cursor-pointer"
                    onClick={() => router.push("/budgets")}
                  >
                    <AlertTriangle
                      className={`h-4 w-4 shrink-0 ${alert.percentage >= 100 ? "text-rose-600" : "text-amber-500"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{alert.name}</p>
                      <p className="text-xs text-muted-foreground">{alert.categoryName}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold tabular-nums ${alert.percentage >= 100 ? "text-rose-600" : "text-amber-500"}`}>
                        {alert.percentage}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCOP(alert.spent)} / {formatCOP(alert.limit)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <SpendingByCategory data={data.categorySpending} />
            <IncomeByCategory data={data.incomeByCategory} />
            <MonthlyTrend data={data.dailySpending} />
            <MonthlyComparison />
          </>
        )}
      </div>
    </div>
  );
}
