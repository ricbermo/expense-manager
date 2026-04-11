"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { formatCOP } from "@/lib/utils/currency";
import { useMonthlyComparison } from "@/lib/hooks/use-monthly-comparison";

export function MonthlyComparison() {
  const { comparison, loading } = useMonthlyComparison();

  if (loading) {
    return <Card className="section-card p-4 md:p-5 h-48 animate-pulse" />;
  }

  const hasData = comparison.some((m) => m.income > 0 || m.expenses > 0);

  if (!hasData) {
    return (
      <Card className="section-card p-4 md:p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">Comparativa mensual</p>
        <p className="py-6 text-center text-xs text-muted-foreground">
          Registra movimientos para ver la comparativa de los últimos 6 meses
        </p>
      </Card>
    );
  }

  return (
    <Card className="section-card p-4 md:p-5">
      <p className="mb-3 text-sm font-semibold text-foreground">Comparativa mensual</p>
      <div className="min-w-0">
        <ResponsiveContainer width="100%" height={180} minWidth={0} minHeight={180}>
          <BarChart data={comparison} barCategoryGap="30%">
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #dbe4ee",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value, name) => [formatCOP(Number(value)), name === "income" ? "Ingresos" : "Gastos"] as [string, string]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  {value === "income" ? "Ingresos" : "Gastos"}
                </span>
              )}
            />
            <Bar dataKey="income" fill="#059669" radius={[3, 3, 0, 0]} name="income" />
            <Bar dataKey="expenses" fill="#e11d48" radius={[3, 3, 0, 0]} name="expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
