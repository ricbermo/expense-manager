"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
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
  const [year, monthNumber] = month.split("-").map(Number);
  const selectedMonth = new Date(year, monthNumber - 1, 1);
  const now = new Date();
  const isPast = selectedMonth < new Date(now.getFullYear(), now.getMonth(), 1);
  const isFuture = !isCurrentMonth && !isPast;

  const priorRates = comparison
    .filter((m) => m.month !== month && m.savingsRate !== null)
    .slice(-5)
    .map((m) => m.savingsRate as number);

  const priorAvg =
    isCurrentMonth && priorRates.length >= 3
      ? priorRates.reduce((s, r) => s + r, 0) / priorRates.length
      : null;

  const deltaPts =
    rate !== null && priorAvg !== null
      ? Math.round((rate - priorAvg) * 100)
      : null;

  const rateColor =
    rate === null
      ? "text-muted-foreground"
      : rate < 0
        ? "text-rose-700"
        : "text-emerald-700";

  return (
    <div className="section-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          Del ingreso que queda
        </p>
        {deltaPts !== null && deltaPts !== 0 && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium ${
              deltaPts > 0 ? "text-emerald-700" : "text-rose-700"
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
      <p className={`mt-1 text-xl font-semibold tabular-nums ${rateColor}`}>
        {rate === null ? "—" : formatPct(rate)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {rate === null
          ? isPast
            ? "Mes cerrado · no hubo ingresos para calcularlo"
            : isCurrentMonth
              ? "Sin ingresos registrados; no se puede calcular"
              : "Mes futuro · aún no hay ingresos para calcularlo"
          : rate < 0
            ? "Gastos superan ingresos; el porcentaje queda en negativo"
            : isFuture
              ? "Mes futuro · porcentaje calculado con los movimientos registrados hasta ahora"
              : priorAvg !== null
                ? `Del ingreso que queda tras gastos · promedio de ${priorRates.length} meses previos: ${formatPct(priorAvg)}`
                : isCurrentMonth && priorRates.length < 3
                  ? "Del ingreso que queda después de gastos · aún no hay 3 meses comparables"
                  : isPast
                    ? "Mes cerrado · porcentaje del ingreso que quedó tras gastos"
                    : "Porcentaje del ingreso que queda después de gastos"}
      </p>
    </div>
  );
}
