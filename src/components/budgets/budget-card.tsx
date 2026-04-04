"use client";

import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
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
  const status =
    percentage >= 100 ? "Excedido" : percentage >= 80 ? "En alerta" : "Saludable";

  const progressColor =
    percentage >= 100
      ? "bg-rose-600"
      : percentage >= 80
        ? "bg-amber-500"
        : "bg-emerald-600";

  return (
    <Card className="section-card gap-4 p-4">
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
          <span className="text-xs font-semibold text-muted-foreground">{status}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground transition-colors duration-200 hover:text-destructive"
            onClick={() => onDelete(budget.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="space-y-1">
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{percentage}% del limite</p>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">
          {formatCOP(budget.spent)} gastado
        </span>
        <span className={remaining >= 0 ? "text-emerald-600" : "text-rose-600"}>
          {remaining >= 0
            ? `${formatCOP(remaining)} disponible`
            : `${formatCOP(Math.abs(remaining))} excedido`}
        </span>
      </div>
    </Card>
  );
}
