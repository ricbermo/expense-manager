"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card } from "@/components/ui/card";
import { formatCOP } from "@/lib/utils/currency";

interface DailyData {
  date: string;
  amount: number;
}

export function MonthlyTrend({ data }: { data: DailyData[] }) {
  if (data.length === 0) {
    return (
      <Card className="section-card p-4 md:p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">Tendencia diaria</p>
        <p className="py-6 text-center text-xs text-muted-foreground">
          Registra gastos para ver la tendencia de gasto acumulado
        </p>
      </Card>
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

  return (
    <Card className="section-card p-4 md:p-5">
      <p className="mb-3 text-sm font-semibold text-foreground">Gasto acumulado</p>
      <div className="min-w-0">
        <ResponsiveContainer width="100%" height={160} minWidth={0} minHeight={160}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
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
              labelStyle={{ color: "#334155" }}
              formatter={(value) => [formatCOP(Number(value)), "Acumulado"]}
              labelFormatter={(label) => `Dia ${label}`}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#1e3a8a"
              fill="url(#colorAmount)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
