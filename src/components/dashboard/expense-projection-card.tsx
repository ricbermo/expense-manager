"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useMonthlyComparison } from "@/lib/hooks/use-monthly-comparison";
import { formatCOP } from "@/lib/utils/currency";

interface Props {
  month: string;
  expensesMTD: number;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function ExpenseProjectionCard({ month, expensesMTD }: Props) {
  const { comparison } = useMonthlyComparison();

  if (month !== getCurrentMonth()) return null;

  const today = new Date();
  const day = today.getDate();
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();

  if (day < 5) {
    return (
      <Card className="section-card p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Proyección a fin de mes
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Datos insuficientes para proyectar
        </p>
      </Card>
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
        ? "text-rose-600"
        : ratio >= 1.1
          ? "text-amber-600"
          : "text-emerald-600";

  const pct =
    avg3m && avg3m > 0 ? Math.round(((projected - avg3m) / avg3m) * 100) : null;

  return (
    <Card className="section-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Proyección a fin de mes
        </p>
        {pct !== null && pct !== 0 && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium ${
              pct > 0 ? "text-rose-600" : "text-emerald-600"
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
      <p className={`mt-1 text-2xl font-semibold ${projectedColor}`}>
        {formatCOP(projected)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {avg3m
          ? `Promedio ${priorExpenses.length}m previos: ${formatCOP(Math.round(avg3m))}`
          : `Día ${day} de ${daysInMonth} · ritmo actual`}
      </p>
    </Card>
  );
}
