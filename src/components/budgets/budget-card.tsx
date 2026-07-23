"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { InlineConfirm } from "@/components/ui/inline-confirm";
import type { BudgetWithCategory } from "@/lib/hooks/use-budgets";
import { cn } from "@/lib/utils";
import { getBudgetPriority } from "@/lib/utils/budget-presentation";
import { formatCOP } from "@/lib/utils/currency";

interface BudgetCardProps {
  budget: BudgetWithCategory;
  movementsHref: string;
  onEdit: (budget: BudgetWithCategory) => void;
  onDelete: (id: string) => void;
}

export function BudgetCard({
  budget,
  movementsHref,
  onEdit,
  onDelete,
}: BudgetCardProps) {
  const progress = getBudgetPriority(budget);
  const percentage = progress.percentage;
  const remaining = budget.limit_amount - budget.spent;
  const status = {
    exceeded: "Excedido",
    at_limit: "En el límite",
    alert: "En alerta",
    healthy: "Dentro del límite",
    invalid: "Límite inválido",
  }[progress.kind];

  const statusColor =
    progress.kind === "exceeded"
      ? "text-chart-expense"
      : progress.kind === "at_limit" || progress.kind === "alert"
        ? "text-amber-700 dark:text-amber-400"
        : "text-muted-foreground";

  const progressColor =
    progress.kind === "exceeded"
      ? "bg-rose-600"
      : progress.kind === "at_limit" || progress.kind === "alert"
        ? "bg-amber-700 dark:bg-amber-500"
        : "bg-emerald-600";

  const remainingColor =
    remaining > 0
      ? "text-chart-income"
      : remaining < 0
        ? "text-chart-expense"
        : "text-muted-foreground";

  const remainingLabel =
    remaining > 0
      ? `${formatCOP(remaining)} disponible`
      : remaining < 0
        ? `${formatCOP(Math.abs(remaining))} excedido`
        : `${formatCOP(0)} disponible`;

  return (
    <div className="section-card flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: budget.categories.color }}
            aria-hidden="true"
          />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium">{budget.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {budget.categories.name}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={cn("text-xs font-semibold", statusColor)}>
            {status}
          </span>
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
            aria-valuenow={percentage}
          >
            <div
              className={cn(
                "h-full rounded-full transition-transform duration-300",
                progressColor,
              )}
              style={{
                transform: `scaleX(${Math.min(percentage, 100) / 100})`,
                transformOrigin: "left",
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {percentage}% del límite
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Revisa el límite mensual
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="tabular-nums text-muted-foreground">
          {formatCOP(budget.spent)} gastado
        </span>
        <span className={cn("tabular-nums", remainingColor)}>
          {remainingLabel}
        </span>
      </div>
      <Link
        href={movementsHref}
        className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full")}
      >
        Ver gastos
      </Link>
    </div>
  );
}
