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
import { useMonthlyComparison } from "@/lib/hooks/use-monthly-comparison";
import { formatCOP } from "@/lib/utils/currency";

export function MonthlyComparison() {
  const { comparison, loading } = useMonthlyComparison();

  if (loading) {
    return <div className="section-card p-4 md:p-5 h-48 animate-pulse" />;
  }

  const hasData = comparison.some((m) => m.income > 0 || m.expenses > 0);

  if (!hasData) {
    return (
      <div className="section-card p-4 md:p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Comparativa mensual
        </h3>
        <p className="py-6 text-center text-xs text-muted-foreground">
          Registra movimientos para ver la comparativa de los últimos 6 meses
        </p>
      </div>
    );
  }

  return (
    <div className="section-card p-4 md:p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        Comparativa mensual
      </h3>
      <div
        className="min-w-0"
        role="img"
        aria-label="Comparativo de ingresos y gastos de los últimos 6 meses"
      >
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
  );
}
