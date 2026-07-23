"use client";

import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { useMonthlyComparison } from "@/lib/hooks/use-monthly-comparison";
import { formatCOP } from "@/lib/utils/currency";

export function MonthlyComparison() {
  const { comparison, loading, error, refetch, isValidating } =
    useMonthlyComparison();

  const hasComparison = comparison.length > 0;

  if (loading && !hasComparison) {
    return (
      <div
        className="section-card flex h-48 items-center gap-3 p-4 md:p-5"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
        <p className="text-xs text-muted-foreground">
          Cargando comparativa mensual...
        </p>
      </div>
    );
  }

  if (error && !hasComparison) {
    return (
      <div className="section-card p-4 md:p-5" role="alert">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Comparativa mensual
        </h3>
        <p className="text-xs text-muted-foreground">
          No se pudo cargar la comparativa de los últimos 6 meses.
        </p>
        <Button className="mt-4" variant="outline" size="sm" onClick={refetch}>
          Reintentar
        </Button>
      </div>
    );
  }

  const hasData = comparison.some((m) => m.income > 0 || m.expenses > 0);

  const refreshStatus = isValidating ? (
    <p
      className="mb-3 text-xs text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      Actualizando comparativa mensual...
    </p>
  ) : error ? (
    <div className="mb-3 flex items-center justify-between gap-3">
      <p
        className="text-xs text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        No se pudo actualizar la comparativa.
      </p>
      <Button variant="outline" size="sm" onClick={refetch}>
        Reintentar
      </Button>
    </div>
  ) : null;

  if (!hasData) {
    return (
      <div className="section-card p-4 md:p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Comparativa mensual
        </h3>
        {refreshStatus}
        <p className="py-6 text-center text-xs text-muted-foreground">
          Registra movimientos para ver la comparativa de los últimos 6 meses
        </p>
      </div>
    );
  }

  const firstMonth = comparison[0]?.month ?? "";
  const lastMonth = comparison.at(-1)?.month ?? "";
  const totalIncome = comparison.reduce((sum, month) => sum + month.income, 0);
  const totalExpenses = comparison.reduce(
    (sum, month) => sum + month.expenses,
    0,
  );
  const formatAccessibleMonth = (month: string) =>
    new Intl.DateTimeFormat("es-CO", {
      month: "long",
      year: "numeric",
    }).format(new Date(`${month}-01T00:00:00`));

  return (
    <div className="section-card p-4 md:p-5" aria-busy={isValidating}>
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        Comparativa mensual
      </h3>
      {refreshStatus}
      <div
        className="min-w-0"
        role="img"
        aria-label={`Comparativa mensual del ${formatAccessibleMonth(firstMonth)} al ${formatAccessibleMonth(lastMonth)}: ingresos acumulados ${formatCOP(totalIncome)} y gastos acumulados ${formatCOP(totalExpenses)}`}
      >
        <div aria-hidden="true">
          <ResponsiveContainer
            width="100%"
            height={180}
            minWidth={0}
            minHeight={180}
          >
            <BarChart data={comparison} barCategoryGap="30%">
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                formatter={(value, name) =>
                  [
                    formatCOP(Number(value)),
                    name === "income" ? "Ingresos" : "Gastos",
                  ] as [string, string]
                }
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span
                    className="text-xs"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {value === "income" ? "Ingresos" : "Gastos"}
                  </span>
                )}
              />
              <Bar
                dataKey="income"
                fill="var(--chart-income)"
                radius={[3, 3, 0, 0]}
                name="income"
              />
              <Bar
                dataKey="expenses"
                fill="var(--chart-expense)"
                radius={[3, 3, 0, 0]}
                name="expenses"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
