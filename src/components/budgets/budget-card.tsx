"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InlineConfirm } from "@/components/ui/inline-confirm";
import { formatCOP } from "@/lib/utils/currency";
import type { BudgetWithCategory } from "@/lib/hooks/use-budgets";
import { getBudgetPriority } from "@/lib/utils/budget-presentation";

interface BudgetCardProps {
  budget: BudgetWithCategory;
  movementsHref: string;
  onEdit: (budget: BudgetWithCategory) => void;
  onDelete: (id: string) => void;
}

export function BudgetCard({ budget, movementsHref, onEdit, onDelete }: BudgetCardProps) {
  const progress = getBudgetPriority(budget);
  const percentage = progress.percentage;
  const remaining = budget.limit_amount - budget.spent;
  const status = {
    exceeded: "Excedido",
    alert: "En alerta",
    healthy: "Dentro del límite",
    invalid: "Límite inválido",
  }[progress.kind];

  const progressColor =
    progress.kind === "exceeded"
      ? "bg-rose-600"
      : progress.kind === "alert"
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
          <div className="leading-tight">
            <p className="font-medium text-sm">{budget.name}</p>
            <p className="text-xs text-muted-foreground">{budget.categories.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">{status}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-muted-foreground transition-colors duration-200 hover:text-foreground"
            onClick={() => onEdit(budget)}
            aria-label={`Editar presupuesto ${budget.name}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <InlineConfirm
            onConfirm={() => onDelete(budget.id)}
            label="Eliminar"
          />
        </div>
      </div>
      {percentage !== null ? (
        <div className="space-y-1">
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={`${budget.name}: ${percentage}% del límite mensual`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(percentage, 100)}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{percentage}% del límite</p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Revisa el límite mensual</p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="tabular-nums text-muted-foreground">{formatCOP(budget.spent)} gastado</span>
        <span className={`tabular-nums ${remaining >= 0 ? "text-chart-income" : "text-rose-700"}`}>
          {remaining >= 0
            ? `${formatCOP(remaining)} disponible`
            : `${formatCOP(Math.abs(remaining))} excedido`}
        </span>
      </div>
      <Button render={<Link href={movementsHref} />} variant="outline" className="h-11 w-full">
        Ver gastos
      </Button>
    </Card>
  );
}
