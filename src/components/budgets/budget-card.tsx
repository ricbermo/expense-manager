"use client";

import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatCOP } from "@/lib/utils/currency";
import type { BudgetWithCategory } from "@/lib/hooks/use-budgets";

interface BudgetCardProps {
  budget: BudgetWithCategory;
  onDelete: (id: string) => void;
}

export function BudgetCard({ budget, onDelete }: BudgetCardProps) {
  const percentage = Math.round((budget.spent / budget.limit_amount) * 100);
  const remaining = budget.limit_amount - budget.spent;

  const progressColor =
    percentage >= 90
      ? "bg-rose-500"
      : percentage >= 70
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <Card className="p-4 gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: budget.categories.color }}
          />
          <span className="font-medium text-sm">
            {budget.categories.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {percentage}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(budget.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="relative">
        <Progress value={Math.min(percentage, 100)} className="h-2" />
        <div
          className={`absolute inset-0 h-2 rounded-full ${progressColor}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">
          {formatCOP(budget.spent)} gastado
        </span>
        <span className={remaining >= 0 ? "text-emerald-500" : "text-rose-500"}>
          {remaining >= 0
            ? `${formatCOP(remaining)} disponible`
            : `${formatCOP(Math.abs(remaining))} excedido`}
        </span>
      </div>
    </Card>
  );
}
