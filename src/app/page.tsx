"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  Wallet,
} from "lucide-react";
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

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function DeltaPill({
  current,
  previous,
  invertColor = false,
}: {
  current: number;
  previous: number;
  invertColor?: boolean;
}) {
  if (previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return null;
  const isUp = pct > 0;
  const isPositive = invertColor ? !isUp : isUp;
  const Icon = isUp ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isPositive ? "text-emerald-600" : "text-rose-600"
      }`}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(pct)}%
    </span>
  );
}

export default function DashboardPage() {
  const [month, setMonth] = useState(getCurrentMonth);
  const { data, loading } = useDashboard(month);
  const router = useRouter();

  const changeMonth = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const net = data.totalIncome - data.totalExpenses;
  const prevNet = data.prevTotalIncome - data.prevTotalExpenses;
  const netDelta = net - prevNet;
  const showNetDelta = prevNet !== 0 && netDelta !== 0;

  const hasCardAlerts = data.creditCardAlerts.length > 0;
  const hasBudgetAlerts = data.budgetAlerts.length > 0;
  const hasAlerts = hasCardAlerts || hasBudgetAlerts;
  const hasBothAlertTypes = hasCardAlerts && hasBudgetAlerts;

  return (
    <div className="pb-6">
      <PageHeader
        title="Dashboard"
        action={
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => changeMonth(-1)}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[8.5rem] text-center text-sm font-medium capitalize text-foreground">
              {formatMonthYear(`${month}-01`)}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => changeMonth(1)}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="app-shell page-stack">
        {loading ? (
          <div className="space-y-3">
            <div className="section-card h-32 animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              <div className="section-card h-24 animate-pulse" />
              <div className="section-card h-24 animate-pulse" />
            </div>
            <div className="section-card h-16 animate-pulse" />
          </div>
        ) : (
          <>
            <section className="section-card p-5 md:p-6" aria-label="Neto del mes">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Neto del mes
              </p>
              <p
                className={`mt-2 text-3xl font-semibold tabular-nums md:text-4xl ${
                  net >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {formatCOP(net)}
              </p>
              {showNetDelta ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className={`inline-flex items-center gap-0.5 font-medium ${
                      netDelta > 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {netDelta > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {formatCOP(Math.abs(netDelta))}
                  </span>
                  <span>vs mes anterior</span>
                </p>
              ) : null}
            </section>

            <div className="grid grid-cols-2 gap-3">
              <button
                className="kpi-card text-left transition-colors hover:border-primary/30 cursor-pointer"
                onClick={() => router.push("/transactions")}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Ingresos
                  </p>
                  <DeltaPill
                    current={data.totalIncome}
                    previous={data.prevTotalIncome}
                  />
                </div>
                <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-600">
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
                  <DeltaPill
                    current={data.totalExpenses}
                    previous={data.prevTotalExpenses}
                    invertColor
                  />
                </div>
                <p className="mt-1 text-xl font-semibold tabular-nums text-rose-600">
                  {formatCOP(data.totalExpenses)}
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

            <button
              className="flex w-full items-center justify-between rounded-2xl border border-border/90 bg-card px-4 py-3 text-left text-card-foreground shadow-sm transition-colors hover:border-primary/30 cursor-pointer"
              onClick={() => router.push("/accounts")}
            >
              <div className="flex items-center gap-3">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Balance total
                  </p>
                  <p
                    className={`mt-0.5 text-lg font-semibold tabular-nums ${
                      data.totalBalance >= 0 ? "text-foreground" : "text-rose-600"
                    }`}
                  >
                    {formatCOP(data.totalBalance)}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>

            {(data.recurringExpenses > 0 || data.occasionalExpenses > 0) && (
              <section className="section-card space-y-3 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Composición de gastos
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Recurrentes</p>
                    <p className="text-lg font-semibold tabular-nums text-emerald-600">
                      {formatCOP(data.recurringExpenses)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ocasionales</p>
                    <p className="text-lg font-semibold tabular-nums text-orange-500">
                      {formatCOP(data.occasionalExpenses)}
                    </p>
                  </div>
                </div>
                {data.totalExpenses > 0 && (
                  <div>
                    <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="bg-emerald-500 transition-all"
                        style={{
                          width: `${(data.recurringExpenses / data.totalExpenses) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-orange-400 transition-all"
                        style={{
                          width: `${(data.occasionalExpenses / data.totalExpenses) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                      <span>
                        {Math.round(
                          (data.recurringExpenses / data.totalExpenses) * 100
                        )}
                        % recurrente
                      </span>
                      <span>
                        {Math.round(
                          (data.occasionalExpenses / data.totalExpenses) * 100
                        )}
                        % ocasional
                      </span>
                    </div>
                  </div>
                )}
              </section>
            )}

            {data.topGrowthCategory && (
              <p className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span>
                  <span className="font-medium text-foreground">
                    {data.topGrowthCategory.name}
                  </span>{" "}
                  aumentó{" "}
                  <span className="font-medium text-foreground">
                    {formatCOP(data.topGrowthCategory.growth)}
                  </span>{" "}
                  vs el mes anterior
                </span>
              </p>
            )}

            {hasAlerts && (
              <section className="space-y-3">
                <h2 className="px-1 text-sm font-semibold text-foreground">
                  Requiere atención
                </h2>
                {hasCardAlerts && (
                  <div className="space-y-2">
                    {hasBothAlertTypes && (
                      <p className="px-1 text-xs text-muted-foreground">
                        Pagos de tarjeta
                      </p>
                    )}
                    {data.creditCardAlerts.map((alert: CreditCardAlert) => {
                      const overdue = alert.daysUntilDue < 0;
                      const urgent = alert.daysUntilDue <= 7;
                      const color = overdue
                        ? "text-rose-600"
                        : urgent
                          ? "text-amber-600"
                          : "text-blue-600";
                      const label = overdue
                        ? `Vencida hace ${Math.abs(alert.daysUntilDue)} días`
                        : alert.daysUntilDue === 0
                          ? "Vence hoy"
                          : `Vence en ${alert.daysUntilDue} días`;
                      return (
                        <button
                          key={alert.id}
                          className="section-card flex w-full items-center gap-3 p-3 text-left transition-colors hover:border-primary/30 cursor-pointer"
                          onClick={() => router.push("/accounts")}
                        >
                          <CreditCard className={`h-4 w-4 shrink-0 ${color}`} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {alert.accountName}
                            </p>
                            <p className={`text-xs ${color}`}>{label}</p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-sm font-semibold tabular-nums ${color}`}
                            >
                              {formatCOP(alert.minimumPayment)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              pago mínimo
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {hasBudgetAlerts && (
                  <div className="space-y-2">
                    {hasBothAlertTypes && (
                      <p className="px-1 text-xs text-muted-foreground">
                        Presupuestos
                      </p>
                    )}
                    {data.budgetAlerts.map((alert) => (
                      <button
                        key={alert.name}
                        className="section-card flex w-full items-center gap-3 p-3 text-left transition-colors hover:border-primary/30 cursor-pointer"
                        onClick={() => router.push("/budgets")}
                      >
                        <AlertTriangle
                          className={`h-4 w-4 shrink-0 ${
                            alert.percentage >= 100
                              ? "text-rose-600"
                              : "text-amber-600"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {alert.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {alert.categoryName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-semibold tabular-nums ${
                              alert.percentage >= 100
                                ? "text-rose-600"
                                : "text-amber-600"
                            }`}
                          >
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
              </section>
            )}

            <div className="space-y-3">
              <SpendingByCategory data={data.categorySpending} />
              <MonthlyTrend data={data.dailySpending} />
              <MonthlyComparison />
              <IncomeByCategory data={data.incomeByCategory} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
