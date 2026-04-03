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
      <Card className="p-4">
        <p className="text-sm font-medium mb-3">Tendencia diaria</p>
        <p className="text-xs text-muted-foreground text-center py-6">
          Sin datos este mes
        </p>
      </Card>
    );
  }

  // Accumulate spending
  let cumulative = 0;
  const chartData = data.map((d) => {
    cumulative += d.amount;
    return {
      date: d.date.split("-")[2],
      amount: cumulative,
    };
  });

  return (
    <Card className="p-4">
      <p className="text-sm font-medium mb-3">Gasto acumulado</p>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value) => [formatCOP(Number(value)), "Acumulado"]}
              labelFormatter={(label) => `Dia ${label}`}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#f43f5e"
              fill="url(#colorAmount)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
