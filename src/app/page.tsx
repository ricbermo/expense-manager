"use client";

import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ExpenseProjectionCard } from "@/components/dashboard/expense-projection-card";
import { IncomeByCategory } from "@/components/dashboard/income-by-category";
import { MonthlyComparison } from "@/components/dashboard/monthly-comparison";
import { MonthlyTrend } from "@/components/dashboard/monthly-trend";
import { SavingsRateCard } from "@/components/dashboard/savings-rate-card";
import { SpendingByCategory } from "@/components/dashboard/spending-by-category";
import { MonthPager } from "@/components/layout/month-pager";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import type { CreditCardAlert } from "@/lib/hooks/use-dashboard";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { formatCOP } from "@/lib/utils/currency";
import { formatDate, getCurrentMonth } from "@/lib/utils/dates";

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
        isPositive ? "text-positive" : "text-negative"
      }`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {Math.abs(pct)}%
    </span>
  );
}

export default function DashboardPage() {
  const [month, setMonth] = useState(getCurrentMonth);
  const [showAnalysis, setShowAnalysis] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("dashboard:showAnalysis") === "true";
    }
    return false;
  });
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const { data, dataMonth, loading, error, refetch, isValidating } =
    useDashboard(month);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !error) setHasLoadedData(true);
  }, [loading, error]);

  const changeMonth = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable) return;
      if (e.key === "ArrowLeft") changeMonth(-1);
      if (e.key === "ArrowRight") changeMonth(1);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [changeMonth]);

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
  const showCompositionBar =
    hasRecurring && hasOccasional && data.totalExpenses > 0;
  const isInitialLoading = loading && !hasLoadedData;
  const isCurrentMonth = month === getCurrentMonth();
  const cardsMonth = dataMonth ?? month;
  const statusSummary =
    net > 0
      ? `Te quedan ${formatCOP(net)} después de gastos.`
      : net < 0
        ? `Gastaste ${formatCOP(Math.abs(net))} más de lo que ingresaste.`
        : "Ingresos y gastos están parejos.";
  const statusMessage = isValidating && !isInitialLoading
    ? "Actualizando datos..."
    : error && hasLoadedData
      ? "No se pudo actualizar; se muestran los últimos datos disponibles."
      : null;

  return (
    <div>
      <PageHeader
        title="Resumen"
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <MonthPager month={month} onChange={changeMonth} />
            {!isCurrentMonth && (
              <Button variant="outline" size="default" onClick={() => setMonth(getCurrentMonth())}>
                Este mes
              </Button>
            )}
            <Button
              nativeButton={false}
              render={<Link href={`/transactions?month=${month}`} />}
              variant="default"
              size="default"
              aria-label="Registrar movimiento"
            >
              <Plus className="h-4 w-4" />
              <span className="sm:hidden">Registrar</span>
              <span className="hidden sm:inline">Registrar movimiento</span>
            </Button>
          </div>
        }
      />

      <div
        className="app-shell page-stack"
        aria-busy={isInitialLoading || isValidating}
      >
        {statusMessage ? (
          <p
            className="text-xs text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            {statusMessage}
          </p>
        ) : null}
        {isInitialLoading ? (
          <div className="space-y-3">
            <div className="section-card h-28 animate-pulse" />
            <div className="section-card h-40 animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              <div className="section-card h-20 animate-pulse" />
              <div className="section-card h-20 animate-pulse" />
            </div>
          </div>
        ) : error && !hasLoadedData ? (
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
          <div className="space-y-5">
            <section
              className="section-card p-5 md:p-6"
              aria-label="Neto del mes"
            >
              <p className="text-sm font-medium text-muted-foreground">
                Neto del mes
              </p>
              <p
                className={`mt-1 text-2xl font-semibold tabular-nums ${
                  net === 0
                    ? "text-muted-foreground"
                    : net > 0
                      ? "text-positive"
                      : "text-negative"
                }`}
              >
                {formatCOP(net)}
              </p>
              <p className="mt-1 text-sm text-foreground">{statusSummary}</p>
              {showNetDelta ? (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className={`inline-flex items-center gap-0.5 font-medium ${
                      netDelta > 0 ? "text-positive" : "text-negative"
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
                        ? "text-negative"
                        : urgent
                          ? "text-warning"
                          : "text-muted-foreground";
                      const label = overdue
                        ? `Vencida hace ${Math.abs(alert.daysUntilDue)} días`
                        : alert.daysUntilDue === 0
                          ? "Vence hoy"
                          : `Vence en ${alert.daysUntilDue} días`;
                      return (
                        <button
                          type="button"
                          key={alert.id}
                          className="clickable-card flex w-full items-center gap-3 overflow-hidden p-3 text-left"
                          onClick={() => router.push("/accounts")}
                        >
                          <CreditCard className={`h-4 w-4 shrink-0 ${color}`} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {alert.accountName}
                            </p>
                            <p className={`text-xs ${color}`}>{label}</p>
                            <p className="text-xs text-muted-foreground">
                              Fecha límite: {formatDate(alert.dueDate)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-sm font-semibold tabular-nums whitespace-nowrap ${color}`}
                            >
                              {formatCOP(alert.minimumPayment)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              pago mínimo
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Total: {formatCOP(alert.totalBalance)}
                            </p>
                          </div>
                          <ChevronRight
                            className="h-4 w-4 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
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
                        type="button"
                        key={alert.name}
                        className="clickable-card flex w-full items-center gap-3 overflow-hidden p-3 text-left"
                        onClick={() => router.push("/budgets")}
                      >
                        <AlertTriangle
                          className={`h-4 w-4 shrink-0 ${
                            alert.percentage >= 100
                              ? "text-negative"
                              : "text-warning"
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
                            className={`text-sm font-semibold tabular-nums whitespace-nowrap ${
                              alert.percentage >= 100
                                ? "text-negative"
                                : "text-warning"
                            }`}
                          >
                            {alert.percentage}%
                          </p>
                          <p className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                            {alert.percentage > 100
                              ? `${formatCOP(alert.spent - alert.limit)} sobre el límite`
                              : alert.percentage === 100
                                ? "Límite alcanzado"
                                : `${formatCOP(alert.limit - alert.spent)} restantes`}
                          </p>
                        </div>
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            <section
              className="section-card"
              aria-label="Resumen del mes"
            >
              <button
                type="button"
                onClick={() => router.push("/transactions")}
                className="flex w-full items-center justify-between border-b border-border/60 px-4 py-3 text-left transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Ingresos
                  </p>
                  <p
                    className={`mt-0.5 text-xl font-semibold tabular-nums whitespace-nowrap overflow-hidden text-ellipsis max-w-full ${
                      data.totalIncome === 0
                        ? "text-muted-foreground"
                        : "text-positive"
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
                type="button"
                onClick={() => router.push("/transactions")}
                className="flex w-full items-center justify-between border-b border-border/60 px-4 py-3 text-left transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Gastos
                  </p>
                  <p
                    className={`mt-0.5 text-xl font-semibold tabular-nums whitespace-nowrap overflow-hidden text-ellipsis max-w-full ${
                      data.totalExpenses === 0
                        ? "text-muted-foreground"
                        : "text-negative"
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
                type="button"
                onClick={() => router.push("/accounts")}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Balance total
                  </p>
                  <p
                    className={`mt-0.5 text-xl font-semibold tabular-nums whitespace-nowrap overflow-hidden text-ellipsis max-w-full ${
                      data.totalBalance < 0
                        ? "text-negative"
                        : "text-foreground"
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
                month={cardsMonth}
                income={data.totalIncome}
                expenses={data.totalExpenses}
              />
              <ExpenseProjectionCard
                month={cardsMonth}
                expensesMTD={data.totalExpenses}
              />
            </div>

            <div className="space-y-3">
              <h2>
                <button
                  type="button"
                  onClick={() => {
                  setShowAnalysis((v) => {
                    const next = !v;
                    sessionStorage.setItem("dashboard:showAnalysis", String(next));
                    return next;
                  });
                }}
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
              </h2>
              {showAnalysis && (
                <div className="grid gap-3 animate-in fade-in duration-200 md:grid-cols-2">
                  {showComposition && (
                    <section className="section-card space-y-3 p-4 md:col-span-2">
                      <p className="text-sm font-semibold text-foreground">
                        Cómo se repartieron los gastos
                      </p>
                      <div
                        className={`grid gap-3 ${
                          showCompositionBar ? "grid-cols-2" : "grid-cols-1"
                        }`}
                      >
                        {hasRecurring && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Gasto fijo
                            </p>
                            <p className="text-lg font-semibold tabular-nums text-positive">
                              {formatCOP(data.recurringExpenses)}
                            </p>
                          </div>
                        )}
                        {hasOccasional && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Gasto ocasional
                            </p>
                            <p className="text-lg font-semibold tabular-nums text-caution">
                              {formatCOP(data.occasionalExpenses)}
                            </p>
                          </div>
                        )}
                      </div>
                      {showCompositionBar && (
                        <div>
                          <div aria-hidden="true" className="flex h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="bg-positive"
                              style={{
                                width: `${(data.recurringExpenses / data.totalExpenses) * 100}%`,
                              }}
                            />
                            <div
                              className="bg-caution"
                              style={{
                                width: `${(data.occasionalExpenses / data.totalExpenses) * 100}%`,
                              }}
                            />
                          </div>
                          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                            <span>
                              {Math.round(
                                (data.recurringExpenses / data.totalExpenses) *
                                  100,
                              )}
                              % fijo
                            </span>
                            <span>
                              {Math.round(
                                (data.occasionalExpenses / data.totalExpenses) *
                                  100,
                              )}
                              % ocasional
                            </span>
                          </div>
                        </div>
                      )}
                      {data.topGrowthCategory ? (
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            El gasto que más aumentó fue{" "}
                            <span className="font-medium text-foreground">
                              {data.topGrowthCategory.name}
                            </span>{" "}
                            ({formatCOP(data.topGrowthCategory.growth)} más que
                            el mes anterior).
                          </span>
                        </p>
                      ) : null}
                    </section>
                  )}
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
