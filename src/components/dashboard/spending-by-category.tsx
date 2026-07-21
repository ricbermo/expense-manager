"use client";

import { PieChart, Pie, Cell } from "recharts";
import { formatCOP } from "@/lib/utils/currency";

interface CategoryData {
  name: string;
  color: string;
  amount: number;
}

export function SpendingByCategory({ data }: { data: CategoryData[] }) {
  if (data.length === 0) {
    return (
      <div className="section-card p-4 md:p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Gastos por categoria</h3>
        <p className="py-6 text-center text-xs text-muted-foreground">
          Registra gastos para ver el desglose por categoria
        </p>
      </div>
    );
  }

  return (
    <div className="section-card p-4 md:p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Gastos por categoria</h3>
      <div className="flex items-center gap-4">
        <div className="w-32 h-32" aria-hidden="true">
          <PieChart width={128} height={128}>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={55}
              paddingAngle={2}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </div>
        <div className="flex-1 space-y-2 overflow-hidden">
          {data.slice(0, 5).map((cat) => (
            <div key={cat.name} className="flex items-center gap-2 text-xs">
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="truncate text-muted-foreground">
                {cat.name}
              </span>
              <span className="ml-auto shrink-0 font-semibold tabular-nums">
                {formatCOP(cat.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
