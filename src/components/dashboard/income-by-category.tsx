"use client";

import { Cell, Pie, PieChart } from "recharts";
import { formatCOP } from "@/lib/utils/currency";

interface CategoryData {
  name: string;
  color: string;
  amount: number;
}

export function IncomeByCategory({ data }: { data: CategoryData[] }) {
  if (data.length === 0) {
    return (
      <div className="section-card p-4 md:p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Ingresos por categoría
        </h3>
        <p className="py-6 text-center text-xs text-muted-foreground">
          Registra ingresos con categoría para ver el desglose
        </p>
      </div>
    );
  }

  const visibleCategories = data.slice(0, 5);
  const otherCategories = data.slice(5);
  const otherAmount = otherCategories.reduce((sum, cat) => sum + cat.amount, 0);
  const chartData =
    otherCategories.length > 0
      ? [
          ...visibleCategories,
          { name: "Otros", color: "var(--chart-5)", amount: otherAmount },
        ]
      : visibleCategories;

  return (
    <div className="section-card p-4 md:p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        Ingresos por categoría
      </h3>
      <div className="flex items-center gap-4">
        <div className="w-32 h-32" aria-hidden="true">
          <PieChart width={128} height={128}>
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={55}
              paddingAngle={2}
            >
              {chartData.map((entry) => (
                <Cell key={`${entry.name}-${entry.color}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </div>
        <div className="flex-1 space-y-2 overflow-hidden">
          {chartData.map((cat) => (
            <div key={cat.name} className="flex items-center gap-2 text-xs">
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="truncate text-muted-foreground">{cat.name}</span>
              <span className="ml-auto shrink-0 font-semibold tabular-nums text-positive">
                +{formatCOP(cat.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
