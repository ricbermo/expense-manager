"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { useMonthlyComparison } from "@/lib/hooks/use-monthly-comparison";
import { formatCOP } from "@/lib/utils/currency";
import { getCurrentMonth } from "@/lib/utils/dates";

interface Props {
  month: string;
  expensesMTD: number;
}

export function ExpenseProjectionCard({ month, expensesMTD }: Props) {
  const { comparison } = useMonthlyComparison();

  const isCurrentMonth = month === getCurrentMonth();
  const [y, m] = month.split("-").map(Number);
  const monthDate = new Date(y, m - 1, 1);
  const now = new Date();
  const isPast = monthDate < new Date(now.getFullYear(), now.getMonth(), 1);

  if (!isCurrentMonth) {
    if (isPast) {
      return (
        <div className="section-card p-4">
          <p className="text-sm font-medium text-muted-foreground">
            Gasto del mes
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
            {formatCOP(expensesMTD)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Mes cerrado</p>
        </div>
      );
    }
    return (
      <div className="section-card p-4">
        <p className="text-sm font-medium text-muted-foreground">
          Proyección a fin de mes
        </p>
        <p className="mt-1 text-xl font-semibold text-muted-foreground">—</p>
        <p className="mt-1 text-xs text-muted-foreground">Mes futuro</p>
      </div>
    );
  }

  const today = new Date();
  const day = today.getDate();
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();

  if (day < 5) {
    return (
      <div className="section-card p-4">
        <p className="text-sm font-medium text-muted-foreground">
          Proyección a fin de mes
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Datos insuficientes para proyectar
        </p>
      </div>
    );
  }

  const projected = Math.round(expensesMTD * (daysInMonth / day));

  const priorExpenses = comparison
    .filter((m) => m.month !== month && m.expenses > 0)
    .slice(-3)
    .map((m) => m.expenses);

  const avg3m =
    priorExpenses.length >= 1
      ? priorExpenses.reduce((s, n) => s + n, 0) / priorExpenses.length
      : null;

  const ratio = avg3m && avg3m > 0 ? projected / avg3m : null;
  const projectedColor =
    ratio === null
      ? "text-foreground"
      : ratio >= 1.25
        ? "text-rose-700"
        : ratio >= 1.1
          ? "text-amber-700"
          : "text-emerald-700";

  const pct =
    avg3m && avg3m > 0 ? Math.round(((projected - avg3m) / avg3m) * 100) : null;

  return (
    <div className="section-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          Proyección a fin de mes
        </p>
        {pct !== null && pct !== 0 && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium ${
              pct > 0 ? "text-rose-700" : "text-emerald-700"
            }`}
          >
            {pct > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(pct)}%
          </span>
        )}
      </div>
      <p
        className={`mt-1 text-xl font-semibold tabular-nums ${projectedColor}`}
      >
        {formatCOP(projected)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {avg3m
          ? priorExpenses.length === 1
            ? `Mes anterior: ${formatCOP(Math.round(avg3m))}`
            : `Promedio ${priorExpenses.length}m previos: ${formatCOP(Math.round(avg3m))}`
          : `Día ${day} de ${daysInMonth} · ritmo actual`}
      </p>
    </div>
  );
}
