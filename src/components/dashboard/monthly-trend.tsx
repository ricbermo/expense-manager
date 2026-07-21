"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatCOP } from "@/lib/utils/currency";

interface DailyData {
  date: string;
  amount: number;
}

export function MonthlyTrend({ data }: { data: DailyData[] }) {
  if (data.length === 0) {
    return (
      <div className="section-card p-4 md:p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Gasto acumulado</h3>
        <p className="py-6 text-center text-xs text-muted-foreground">
          Registra gastos para ver la tendencia de gasto acumulado
        </p>
      </div>
    );
  }

  const chartData = data.reduce<Array<{ date: string; amount: number }>>(
    (acc, d) => {
      const previous = acc.at(-1)?.amount ?? 0;
      acc.push({
        date: d.date.split("-")[2],
        amount: previous + d.amount,
      });
      return acc;
    },
    []
  );

  const maxAmount = chartData.at(-1)?.amount ?? 0;
  const lastDay = chartData.at(-1)?.date ?? "";

  return (
    <div className="section-card p-4 md:p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Gasto acumulado</h3>
      <div
        className="min-w-0"
        role="img"
        aria-label={`Gasto acumulado: ${formatCOP(maxAmount)} al día ${lastDay}`}
      >
        <ResponsiveContainer width="100%" height={160} minWidth={0} minHeight={160}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              formatter={(value) => [formatCOP(Number(value)), "Acumulado"]}
              labelFormatter={(label) => `Dia ${label}`}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="var(--chart-1)"
              fill="url(#colorAmount)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
