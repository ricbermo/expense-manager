"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  CreditCard,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { MonthPager } from "@/components/layout/month-pager";
import { Button } from "@/components/ui/button";
import { SpendingByCategory } from "@/components/dashboard/spending-by-category";
import { IncomeByCategory } from "@/components/dashboard/income-by-category";
import { MonthlyTrend } from "@/components/dashboard/monthly-trend";
import { MonthlyComparison } from "@/components/dashboard/monthly-comparison";
import { SavingsRateCard } from "@/components/dashboard/savings-rate-card";
import { ExpenseProjectionCard } from "@/components/dashboard/expense-projection-card";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { formatCOP } from "@/lib/utils/currency";
import { getCurrentMonth } from "@/lib/utils/dates";
import type { CreditCardAlert } from "@/lib/hooks/use-dashboard";

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
        isPositive ? "text-emerald-700" : "text-rose-700"
      }`}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(pct)}%
    </span>
  );
}

export default function DashboardPage() {
  const [month, setMonth] = useState(getCurrentMonth);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const { data, loading, error, refetch, isValidating } = useDashboard(month);
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

  const hasRecurring = data.recurringExpenses > 0;
  const hasOccasional = data.occasionalExpenses > 0;
  const showComposition = hasRecurring || hasOccasional;
  const showCompositionBar = hasRecurring && hasOccasional && data.totalExpenses > 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        action={<MonthPager month={month} onChange={changeMonth} />}
      />

      <div className="app-shell page-stack">
        {loading ? (
          <div className="space-y-3">
            <div className="section-card h-28 animate-pulse" />
            <div className="section-card h-40 animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              <div className="section-card h-20 animate-pulse" />
              <div className="section-card h-20 animate-pulse" />
            </div>
          </div>
        ) : error ? (
          <div className="section-card flex flex-col items-center gap-3 p-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                No se pudieron cargar los datos
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Revisa tu conexión e intenta de nuevo
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={refetch}>
              Reintentar
            </Button>
          </div>
        ) : (
          <div
            className={`space-y-5 transition-opacity duration-200 ${
              isValidating ? "opacity-60" : "opacity-100"
            }`}
          >
            <section className="section-card p-5 md:p-6" aria-label="Neto del mes">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Neto del mes
              </p>
              <p
                className={`mt-2 text-3xl font-semibold tabular-nums md:text-4xl ${
                  net === 0
                    ? "text-muted-foreground"
                    : net > 0
                      ? "text-emerald-700"
                      : "text-rose-700"
                }`}
              >
                {formatCOP(net)}
              </p>
              {showNetDelta ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className={`inline-flex items-center gap-0.5 font-medium ${
                      netDelta > 0 ? "text-emerald-700" : "text-rose-700"
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
                        ? "text-rose-700"
                        : urgent
                          ? "text-amber-700"
                          : "text-blue-700";
                      const label = overdue
                        ? `Vencida hace ${Math.abs(alert.daysUntilDue)} días`
                        : alert.daysUntilDue === 0
                          ? "Vence hoy"
                          : `Vence en ${alert.daysUntilDue} días`;
                      return (
                        <button
                          key={alert.id}
                          className="clickable-card flex w-full items-center gap-3 p-3 text-left"
                          onClick={() => router.push("/accounts")}
                        >
                          <CreditCard className={`h-4 w-4 shrink-0 ${color}`} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {alert.accountName}
                            </p>
                            <p className={`text-xs ${color}`}>{label}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p
                              className={`text-sm font-semibold tabular-nums whitespace-nowrap ${color}`}
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
                        className="clickable-card flex w-full items-center gap-3 p-3 text-left"
                        onClick={() => router.push("/budgets")}
                      >
                        <AlertTriangle
                          className={`h-4 w-4 shrink-0 ${
                            alert.percentage >= 100
                              ? "text-rose-700"
                              : "text-amber-700"
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
                        <div className="shrink-0 text-right">
                          <p
                            className={`text-sm font-semibold tabular-nums whitespace-nowrap ${
                              alert.percentage >= 100
                                ? "text-rose-700"
                                : "text-amber-700"
                            }`}
                          >
                            {alert.percentage}%
                          </p>
                          <p className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                            {formatCOP(alert.spent)} / {formatCOP(alert.limit)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            <section
              className="section-card divide-y divide-border/60"
              aria-label="Resumen del mes"
            >
              <button
                onClick={() => router.push("/transactions")}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Ingresos
                  </p>
                  <p
                    className={`mt-0.5 text-xl font-semibold tabular-nums whitespace-nowrap ${
                      data.totalIncome === 0
                        ? "text-muted-foreground"
                        : "text-emerald-700"
                    }`}
                  >
                    {formatCOP(data.totalIncome)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <DeltaPill
                    current={data.totalIncome}
                    previous={data.prevTotalIncome}
                  />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
              <button
                onClick={() => router.push("/transactions")}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Gastos
                  </p>
                  <p
                    className={`mt-0.5 text-xl font-semibold tabular-nums whitespace-nowrap ${
                      data.totalExpenses === 0
                        ? "text-muted-foreground"
                        : "text-rose-700"
                    }`}
                  >
                    {formatCOP(data.totalExpenses)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <DeltaPill
                    current={data.totalExpenses}
                    previous={data.prevTotalExpenses}
                    invertColor
                  />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
              <button
                onClick={() => router.push("/accounts")}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">
                    Balance total
                  </p>
                  <p
                    className={`mt-0.5 text-xl font-semibold tabular-nums whitespace-nowrap ${
                      data.totalBalance < 0 ? "text-rose-700" : "text-foreground"
                    }`}
                  >
                    {formatCOP(data.totalBalance)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </section>

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

            {showComposition && (
              <section className="section-card space-y-3 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Composición de gastos
                </p>
                <div
                  className={`grid gap-3 ${
                    showCompositionBar ? "grid-cols-2" : "grid-cols-1"
                  }`}
                >
                  {hasRecurring && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Recurrentes
                      </p>
                      <p className="text-lg font-semibold tabular-nums text-emerald-700">
                        {formatCOP(data.recurringExpenses)}
                      </p>
                    </div>
                  )}
                  {hasOccasional && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Ocasionales
                      </p>
                      <p className="text-lg font-semibold tabular-nums text-orange-700">
                        {formatCOP(data.occasionalExpenses)}
                      </p>
                    </div>
                  )}
                </div>
                {showCompositionBar && (
                  <div>
                    <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="bg-emerald-700 transition-[width] duration-300 ease-out"
                        style={{
                          width: `${(data.recurringExpenses / data.totalExpenses) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-orange-700 transition-[width] duration-300 ease-out"
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
                  Gasto en{" "}
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

            <div className="space-y-3">
              <button
                onClick={() => setShowAnalysis((v) => !v)}
                aria-expanded={showAnalysis}
                className="flex w-full items-center justify-between rounded-xl px-1 py-1 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
              >
                <span>Análisis</span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    showAnalysis ? "rotate-180" : ""
                  }`}
                />
              </button>
              {showAnalysis && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <SpendingByCategory data={data.categorySpending} />
                  <MonthlyTrend data={data.dailySpending} />
                  <MonthlyComparison />
                  <IncomeByCategory data={data.incomeByCategory} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
