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
  const { transactions, loading, createTransaction, deleteTransaction } =
    useTransactions(month);
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
    <div>
      <PageHeader
        title="Movimientos"
        action={
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo
          </Button>
        }
      />

      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <p className="text-sm font-medium capitalize">
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
                className="h-16 rounded-xl bg-card animate-pulse border border-border"
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-xl bg-card p-6 border border-border text-center text-muted-foreground">
            <p>No hay movimientos este mes</p>
          </div>
        ) : (
          <TransactionList
            transactions={transactions}
            onDelete={handleDelete}
          />
        )}
      </div>

      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={createTransaction}
        accounts={accounts}
      />
    </div>
  );
}
