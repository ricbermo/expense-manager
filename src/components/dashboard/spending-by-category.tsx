"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { formatCOP } from "@/lib/utils/currency";

interface CategoryData {
  name: string;
  color: string;
  amount: number;
}

export function SpendingByCategory({ data }: { data: CategoryData[] }) {
  if (data.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm font-medium mb-3">Gastos por categoria</p>
        <p className="text-xs text-muted-foreground text-center py-6">
          Sin datos este mes
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <p className="text-sm font-medium mb-3">Gastos por categoria</p>
      <div className="flex items-center gap-4">
        <div className="w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
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
          </ResponsiveContainer>
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
              <span className="ml-auto font-medium shrink-0">
                {formatCOP(cat.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
