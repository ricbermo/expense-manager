"use client";

import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { BudgetCard } from "@/components/budgets/budget-card";
import { BudgetForm } from "@/components/budgets/budget-form";
import { useBudgets } from "@/lib/hooks/use-budgets";
import { formatCOP } from "@/lib/utils/currency";
import { formatMonthYear } from "@/lib/utils/dates";

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function BudgetsPage() {
  const [month, setMonth] = useState(getCurrentMonth);
  const [formOpen, setFormOpen] = useState(false);
  const { budgets, loading, upsertBudget, deleteBudget, copyFromPreviousMonth } =
    useBudgets(month);

  const changeMonth = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const handleDelete = async (id: string) => {
    if (confirm("Eliminar este presupuesto?")) {
      await deleteBudget(id);
    }
  };

  const totalBudget = budgets.reduce((s, b) => s + b.limit_amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <div className="pb-6">
      <PageHeader
        title="Presupuesto"
        description="Monitorea limites y gasto acumulado por categoria"
        action={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={copyFromPreviousMonth}
              title="Copiar del mes anterior"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo
            </Button>
          </div>
        }
      />

      <div className="app-shell page-stack">
        <div className="month-toolbar">
          <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <p className="text-sm font-semibold capitalize text-foreground">
            {formatMonthYear(`${month}-01`)}
          </p>
          <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {budgets.length > 0 && (
          <div className="kpi-card">
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Gastado
                </p>
                <p className="font-semibold text-rose-600">{formatCOP(totalSpent)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Presupuesto
                </p>
                <p className="font-semibold">{formatCOP(totalBudget)}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="section-card h-24 animate-pulse"
              />
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <div className="empty-state text-muted-foreground">
            <p>No hay presupuestos configurados</p>
            <p className="text-xs mt-1">Define limites de gasto por categoria</p>
            <Button className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Crear presupuesto
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <BudgetForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={upsertBudget}
        existingCategoryIds={budgets.map((b) => b.category_id)}
      />
    </div>
  );
}
