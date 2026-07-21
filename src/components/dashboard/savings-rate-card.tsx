"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { useMonthlyComparison } from "@/lib/hooks/use-monthly-comparison";
import { getCurrentMonth } from "@/lib/utils/dates";

interface Props {
  month: string;
  income: number;
  expenses: number;
}

function formatPct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function SavingsRateCard({ month, income, expenses }: Props) {
  const { comparison } = useMonthlyComparison();

  const hasIncome = income > 0;
  const rate = hasIncome ? (income - expenses) / income : null;
  const isCurrentMonth = month === getCurrentMonth();

  const priorRates = comparison
    .filter((m) => m.month !== month && m.savingsRate !== null)
    .slice(-5)
    .map((m) => m.savingsRate as number);

  const priorAvg =
    isCurrentMonth && priorRates.length >= 3
      ? priorRates.reduce((s, r) => s + r, 0) / priorRates.length
      : null;

  const deltaPts =
    rate !== null && priorAvg !== null ? Math.round((rate - priorAvg) * 100) : null;

  const rateColor =
    rate === null
      ? "text-muted-foreground"
      : rate < 0
        ? "text-rose-600"
        : "text-emerald-600";

  return (
    <div className="section-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Tasa de ahorro
        </p>
        {deltaPts !== null && deltaPts !== 0 && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium ${
              deltaPts > 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {deltaPts > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(deltaPts)} pts
          </span>
        )}
      </div>
      <p className={`mt-1 text-xl font-semibold ${rateColor}`}>
        {rate === null ? "—" : formatPct(rate)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {rate === null
          ? "Sin ingresos este mes"
          : rate < 0
            ? "Gastos superan ingresos"
            : priorAvg !== null
              ? `Promedio ${priorRates.length}m previos: ${formatPct(priorAvg)}`
              : "Ahorrado del ingreso del mes"}
      </p>
    </div>
  );
}
