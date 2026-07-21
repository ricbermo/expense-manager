"use client";

import { useState } from "react";
import { Plus, Copy } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { MonthPager } from "@/components/layout/month-pager";
import { Button } from "@/components/ui/button";
import { BudgetCard } from "@/components/budgets/budget-card";
import { BudgetForm } from "@/components/budgets/budget-form";
import { useBudgets, type BudgetWithCategory } from "@/lib/hooks/use-budgets";
import { formatCOP } from "@/lib/utils/currency";
import { getCurrentMonth } from "@/lib/utils/dates";

export default function BudgetsPage() {
  const [month, setMonth] = useState(getCurrentMonth);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] =
    useState<BudgetWithCategory | null>(null);
  const { budgets, loading, createBudget, updateBudget, deleteBudget, copyFromPreviousMonth } =
    useBudgets(month);

  const changeMonth = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBudget(id);
      toast.success("Presupuesto eliminado");
    } catch {
      toast.error("No se pudo eliminar el presupuesto");
    }
  };

  const handleEdit = (budget: BudgetWithCategory) => {
    setEditingBudget(budget);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingBudget(null);
    setFormOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingBudget(null);
    }
  };

  const handleSaveBudget = async (values: {
    id?: string;
    name: string;
    categoryId: string;
    limitAmount: number;
  }) => {
    if (values.id) {
      await updateBudget({
        id: values.id,
        name: values.name,
        categoryId: values.categoryId,
        limitAmount: values.limitAmount,
      });
      return;
    }

    await createBudget({
      name: values.name,
      categoryId: values.categoryId,
      limitAmount: values.limitAmount,
    });
  };

  const totalBudget = budgets.reduce((s, b) => s + b.limit_amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <div className="pb-6">
      <PageHeader
        title="Presupuesto"
        description="Monitorea limites y gasto acumulado por categoria"
        action={
          <div className="flex items-center gap-2">
            <MonthPager month={month} onChange={changeMonth} />
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  await copyFromPreviousMonth();
                  toast.success("Presupuestos copiados del mes anterior");
                } catch {
                  toast.error("No se pudieron copiar los presupuestos");
                }
              }}
              title="Copiar del mes anterior"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo
            </Button>
          </div>
        }
      />

      <div className="app-shell page-stack">
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
            <p className="font-medium text-foreground">Sin presupuestos este mes</p>
            <p className="text-xs mt-1">Define limites de gasto por categoria para detectar cuando te excedes y poder ahorrar mas</p>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreate}>
                <Plus className="mr-1 h-4 w-4" />
                Crear presupuesto
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await copyFromPreviousMonth();
                    toast.success("Presupuestos copiados del mes anterior");
                  } catch {
                    toast.error("No se pudieron copiar los presupuestos");
                  }
                }}
              >
                <Copy className="mr-1 h-4 w-4" />
                Copiar del mes anterior
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <BudgetForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        mode={editingBudget ? "edit" : "create"}
        initialValues={
          editingBudget
            ? {
                id: editingBudget.id,
                name: editingBudget.name,
                categoryId: editingBudget.category_id,
                limitAmount: editingBudget.limit_amount,
              }
            : null
        }
        onSubmit={handleSaveBudget}
      />
    </div>
  );
}
