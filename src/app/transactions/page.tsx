"use client";

import { useMemo, useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Search, X, Filter } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionList } from "@/components/transactions/transaction-list";
import { PendingTransactionList } from "@/components/transactions/pending-transaction-list";
import { useTransactions, type TransactionWithRelations } from "@/lib/hooks/use-transactions";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { formatMonthYear } from "@/lib/utils/dates";

type TypeFilter = "all" | "expense" | "income" | "transfer";
type OccasionalFilter = "all" | "occasional" | "recurring";

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
  const [accountFilter, setAccountFilter] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [occasionalFilter, setOccasionalFilter] = useState<OccasionalFilter>("all");

  const activeFilterCount = [accountFilter, minAmount, maxAmount].filter(Boolean).length;

  const pendingTransactions = useMemo(
    () => transactions.filter((t) => t.status === "pending"),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    let result = transactions.filter((t) => t.status !== "pending");
    if (typeFilter !== "all") {
      result = result.filter((t) => t.type === typeFilter);
    }
    if (accountFilter) {
      result = result.filter((t) => t.account_id === accountFilter);
    }
    if (minAmount) {
      const min = Number(minAmount.replace(/\D/g, ""));
      if (!isNaN(min)) result = result.filter((t) => t.amount >= min);
    }
    if (maxAmount) {
      const max = Number(maxAmount.replace(/\D/g, ""));
      if (!isNaN(max)) result = result.filter((t) => t.amount <= max);
    }
    if (occasionalFilter === "occasional") {
      result = result.filter((t) => t.type === "expense" && t.is_occasional);
    } else if (occasionalFilter === "recurring") {
      result = result.filter((t) => t.type === "expense" && !t.is_occasional);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.description?.toLowerCase().includes(q) ||
          t.categories?.name?.toLowerCase().includes(q) ||
          t.accounts?.name?.toLowerCase().includes(q) ||
          t.budgets?.name?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return result;
  }, [transactions, search, typeFilter, accountFilter, minAmount, maxAmount, occasionalFilter]);

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

  const handleToggleOccasional = async (id: string, value: boolean) => {
    try {
      await updateTransaction(id, { is_occasional: value });
    } catch {
      toast.error("No se pudo actualizar el gasto");
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

        {pendingTransactions.length > 0 && (
          <PendingTransactionList
            transactions={pendingTransactions}
            onEdit={handleEdit}
          />
        )}

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
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1 flex-1 overflow-x-auto">
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
                    className="h-7 px-2.5 text-xs shrink-0"
                    onClick={() => setTypeFilter(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                className="h-7 px-2.5 text-xs shrink-0 gap-1"
                onClick={() => setShowFilters((v) => !v)}
              >
                <Filter className="h-3.5 w-3.5" />
                Filtros
                {activeFilterCount > 0 && (
                  <Badge className="h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center ml-0.5">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {([
                ["all", "Todos"],
                ["occasional", "Ocasionales"],
                ["recurring", "Recurrentes"],
              ] as const).map(([value, label]) => (
                <Button
                  key={value}
                  variant={occasionalFilter === value ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-xs shrink-0"
                  onClick={() => setOccasionalFilter(value)}
                >
                  {label}
                </Button>
              ))}
            </div>

            {showFilters && (
              <div className="rounded-lg border border-border/60 p-3 space-y-3">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Cuenta</p>
                  <Select value={accountFilter} onValueChange={(v) => setAccountFilter(v ?? "")}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todas las cuentas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas las cuentas</SelectItem>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id} label={a.name}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Monto mínimo</p>
                    <Input
                      type="number"
                      placeholder="0"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Monto máximo</p>
                    <Input
                      type="number"
                      placeholder="Sin límite"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs w-full"
                    onClick={() => {
                      setAccountFilter("");
                      setMinAmount("");
                      setMaxAmount("");
                    }}
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            )}
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
                onToggleOccasional={handleToggleOccasional}
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
