"use client";

import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionList } from "@/components/transactions/transaction-list";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { formatMonthYear } from "@/lib/utils/dates";

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function TransactionsPage() {
  const [month, setMonth] = useState(getCurrentMonth);
  const [formOpen, setFormOpen] = useState(false);
  const {
    transactions,
    loading,
    error,
    refetch,
    createTransaction,
    createSharedExpense,
    deleteTransaction,
  } = useTransactions(month);
  const { accounts } = useAccounts();

  const changeMonth = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const handleDelete = async (id: string) => {
    if (confirm("Eliminar este movimiento?")) {
      await deleteTransaction(id);
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
            <p>No hay movimientos este mes</p>
            <Button className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Agregar movimiento
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
            <TransactionList
              transactions={transactions}
              onDelete={handleDelete}
            />
          </div>
        )}
      </div>

      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={createTransaction}
        onSubmitShared={createSharedExpense}
        accounts={accounts}
      />
    </div>
  );
}
