"use client";

import { useMemo, useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionList } from "@/components/transactions/transaction-list";
import { useTransactions, type TransactionWithRelations } from "@/lib/hooks/use-transactions";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { formatMonthYear } from "@/lib/utils/dates";

type TypeFilter = "all" | "expense" | "income" | "transfer";

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function TransactionsPage() {
  const [month, setMonth] = useState(getCurrentMonth);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithRelations | null>(null);
  const {
    transactions,
    loading,
    error,
    refetch,
    createTransaction,
    createSharedExpense,
    updateTransaction,
    deleteTransaction,
  } = useTransactions(month);
  const { accounts } = useAccounts();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (typeFilter !== "all") {
      result = result.filter((t) => t.type === typeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.description?.toLowerCase().includes(q) ||
          t.categories?.name?.toLowerCase().includes(q) ||
          t.accounts?.name?.toLowerCase().includes(q) ||
          t.budgets?.name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [transactions, search, typeFilter]);

  const changeMonth = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const handleEdit = (transaction: TransactionWithRelations) => {
    setEditingTransaction(transaction);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingTransaction(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      toast.success("Movimiento eliminado");
    } catch {
      toast.error("No se pudo eliminar el movimiento");
    }
  };

  return (
    <div className="pb-6">
      <PageHeader
        title="Movimientos"
        description="Registra ingresos, gastos y transferencias por mes"
        action={
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo
          </Button>
        }
      />

      <div className="app-shell page-stack">
        <div className="month-toolbar">
          <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} aria-label="Mes anterior">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <p className="text-sm font-semibold capitalize text-foreground">
            {formatMonthYear(`${month}-01`)}
          </p>
          <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} aria-label="Mes siguiente">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {transactions.length > 0 && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descripcion, categoria, cuenta..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8 h-9"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex gap-1">
              {([
                ["all", "Todos"],
                ["expense", "Gastos"],
                ["income", "Ingresos"],
                ["transfer", "Transferencias"],
              ] as const).map(([value, label]) => (
                <Button
                  key={value}
                  variant={typeFilter === value ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setTypeFilter(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="section-card h-16 animate-pulse"
              />
            ))}
          </div>
        ) : error && transactions.length === 0 ? (
          <div className="empty-state text-muted-foreground">
            <p>No se pudieron cargar los movimientos</p>
            <p className="mt-1 text-xs">{error}</p>
            <Button className="mt-4" onClick={() => void refetch()}>
              Reintentar
            </Button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state text-muted-foreground">
            <p className="font-medium text-foreground">Sin movimientos en {formatMonthYear(`${month}-01`)}</p>
            <p className="text-xs mt-1">Registra un ingreso, gasto o transferencia para comenzar a rastrear tus finanzas</p>
            <Button className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Registrar primer movimiento
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {error ? (
              <div className="section-card p-3">
                <p className="text-sm font-medium">Error al actualizar movimientos</p>
                <p className="mt-1 text-xs text-muted-foreground">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => void refetch()}
                >
                  Reintentar
                </Button>
              </div>
            ) : null}
            {filteredTransactions.length === 0 ? (
              <div className="empty-state text-muted-foreground">
                <p>No se encontraron movimientos</p>
                <p className="text-xs mt-1">Intenta con otro filtro o busqueda</p>
              </div>
            ) : (
              <TransactionList
                transactions={filteredTransactions}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </div>
        )}
      </div>

      <TransactionForm
        open={formOpen}
        onOpenChange={handleFormClose}
        onSubmit={createTransaction}
        onSubmitShared={createSharedExpense}
        onUpdate={updateTransaction}
        accounts={accounts}
        editTransaction={editingTransaction}
      />
    </div>
  );
}
