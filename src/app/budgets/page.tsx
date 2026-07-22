"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Copy } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { MonthPager } from "@/components/layout/month-pager";
import { Button } from "@/components/ui/button";
import { BudgetCard } from "@/components/budgets/budget-card";
import { BudgetForm } from "@/components/budgets/budget-form";
import { useBudgets, type BudgetWithCategory } from "@/lib/hooks/use-budgets";
import {
  getBudgetCopyMessage,
  getBudgetPriority,
  getBudgetSummary,
  orderBudgetsByPriority,
} from "@/lib/utils/budget-presentation";
import { formatCOP } from "@/lib/utils/currency";
import { getCurrentMonth } from "@/lib/utils/dates";

export default function BudgetsPage() {
  const [month, setMonth] = useState(getCurrentMonth);
  const [formOpen, setFormOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  const [editingBudget, setEditingBudget] =
    useState<BudgetWithCategory | null>(null);
  const {
    budgets,
    loading,
    error,
    refetch,
    createBudget,
    updateBudget,
    deleteBudget,
    copyFromPreviousMonth,
  } = useBudgets(month);
  const orderedBudgets = useMemo(() => orderBudgetsByPriority(budgets), [budgets]);
  const summary = useMemo(() => getBudgetSummary(budgets), [budgets]);
  const priorityBudget = orderedBudgets.find((budget) => {
    const priority = getBudgetPriority(budget).kind;
    return priority === "exceeded" || priority === "alert";
  });

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

  const handleCopyPreviousMonth = async () => {
    setCopying(true);
    try {
      const result = await copyFromPreviousMonth();
      toast.success(getBudgetCopyMessage(result));
    } catch {
      toast.error("No se pudieron copiar los presupuestos.");
    } finally {
      setCopying(false);
    }
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

  return (
    <div className="pb-6">
      <PageHeader
        title="Presupuesto"
        description="Monitorea límites y gasto acumulado por categoría"
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <MonthPager
              month={month}
              onChange={changeMonth}
              className="justify-between sm:justify-start"
              buttonClassName="h-11 w-11"
            />
            <div className="grid grid-cols-1 gap-2 sm:flex">
              <Button
                variant="outline"
                className="h-11"
                disabled={copying}
                onClick={() => void handleCopyPreviousMonth()}
              >
                <Copy className="h-4 w-4" />
                {copying ? "Copiando..." : "Copiar mes anterior"}
              </Button>
              <Button className="h-11" onClick={handleCreate}>
                <Plus className="h-4 w-4" />
                Nuevo
              </Button>
            </div>
          </div>
        }
      />

      <div className="app-shell page-stack">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="section-card h-24 animate-pulse"
              />
            ))}
          </div>
        ) : error && budgets.length === 0 ? (
          <div className="empty-state text-muted-foreground">
            <p className="font-medium text-foreground">No se pudieron cargar los presupuestos</p>
            <p className="mt-1 text-xs">{error}</p>
            <Button className="mt-4 h-11" onClick={() => void refetch()}>
              Reintentar
            </Button>
          </div>
        ) : budgets.length === 0 ? (
          <div className="empty-state text-muted-foreground">
            <p className="font-medium text-foreground">Sin presupuestos este mes</p>
            <p className="mt-1 text-xs">Define límites de gasto por categoría para detectar cuándo te excedes.</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button className="h-11" onClick={handleCreate}>
                <Plus className="h-4 w-4" />
                Crear presupuesto
              </Button>
              <Button
                variant="outline"
                className="h-11"
                disabled={copying}
                onClick={() => void handleCopyPreviousMonth()}
              >
                <Copy className="h-4 w-4" />
                Copiar del mes anterior
              </Button>
            </div>
          </div>
        ) : (
          <>
            {error ? (
              <div className="section-card p-3">
                <p className="text-sm font-medium">Error al actualizar los presupuestos</p>
                <p className="mt-1 text-xs text-muted-foreground">{error}</p>
                <Button variant="ghost" className="mt-2 h-11" onClick={() => void refetch()}>
                  Reintentar
                </Button>
              </div>
            ) : null}
            <section className="section-card p-4" aria-labelledby="budget-summary-heading">
              <p id="budget-summary-heading" className="text-sm font-medium text-foreground">
                {summary.kind === "exceeded"
                  ? `${summary.budgetCount} ${summary.budgetCount === 1 ? "presupuesto excedido" : "presupuestos excedidos"}`
                  : "Todos los presupuestos están dentro del límite"}
              </p>
              <p className={`mt-1 text-sm font-semibold tabular-nums ${summary.kind === "exceeded" ? "text-rose-700" : "text-chart-income"}`}>
                {summary.kind === "exceeded"
                  ? `${formatCOP(summary.amount)} por encima del límite`
                  : `${formatCOP(summary.amount)} disponible`}
              </p>
              {priorityBudget ? (
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
                  <div className="min-w-0">
                    <p className="font-medium">{priorityBudget.name}</p>
                    <p className="text-xs text-muted-foreground">{priorityBudget.categories.name}</p>
                  </div>
                  <Button
                    render={
                      <Link
                        href={{
                          pathname: "/transactions",
                          query: { month, budget: priorityBudget.id },
                        }}
                      />
                    }
                    variant="outline"
                    className="h-11 shrink-0"
                  >
                    Ver gastos
                  </Button>
                </div>
              ) : null}
            </section>
            <div className="space-y-3">
              {orderedBudgets.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  movementsHref={`/transactions?month=${month}&budget=${budget.id}`}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
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
