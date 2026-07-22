"use client";

import { Filter, Plus, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { MonthPager } from "@/components/layout/month-pager";
import { PageHeader } from "@/components/layout/page-header";
import { PendingTransactionList } from "@/components/transactions/pending-transaction-list";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionList } from "@/components/transactions/transaction-list";
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
import { useAccounts } from "@/lib/hooks/use-accounts";
import {
  type TransactionWithRelations,
  useTransactions,
} from "@/lib/hooks/use-transactions";
import { formatMonthYear, getCurrentMonth } from "@/lib/utils/dates";

type TypeFilter = "all" | "expense" | "income" | "transfer";
type OccasionalFilter = "all" | "occasional" | "recurring";

function TransactionsPageContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const requestedMonth = searchParams.get("month");
  const [localMonth, setLocalMonth] = useState(getCurrentMonth);
  const month = requestedMonth ?? localMonth;
  const [formOpen, setFormOpen] = useState(
    () => searchParams.get("new") === "1",
  );
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionWithRelations | null>(null);
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
  const [occasionalFilter, setOccasionalFilter] =
    useState<OccasionalFilter>("all");
  const budgetFilter = searchParams.get("budget") ?? "";

  const hasActiveFilters =
    Boolean(search) ||
    typeFilter !== "all" ||
    occasionalFilter !== "all" ||
    Boolean(accountFilter) ||
    Boolean(minAmount) ||
    Boolean(maxAmount) ||
    Boolean(budgetFilter);

  const activeFilterCount = [
    search,
    typeFilter !== "all" ? typeFilter : "",
    occasionalFilter !== "all" ? occasionalFilter : "",
    accountFilter,
    minAmount,
    maxAmount,
    budgetFilter,
  ].filter(Boolean).length;

  const pendingTransactions = useMemo(
    () => transactions.filter((t) => t.status === "pending"),
    [transactions],
  );

  const filteredTransactions = useMemo(() => {
    let result = transactions.filter((t) => t.status !== "pending");
    if (typeFilter !== "all") {
      result = result.filter((t) => t.type === typeFilter);
    }
    if (accountFilter) {
      result = result.filter((t) => t.account_id === accountFilter);
    }
    if (budgetFilter) {
      result = result.filter((t) => t.budget_id === budgetFilter);
    }
    if (minAmount) {
      const min = Number(minAmount.replace(/\D/g, ""));
      if (!Number.isNaN(min)) result = result.filter((t) => t.amount >= min);
    }
    if (maxAmount) {
      const max = Number(maxAmount.replace(/\D/g, ""));
      if (!Number.isNaN(max)) result = result.filter((t) => t.amount <= max);
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
          t.tags?.some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [
    transactions,
    search,
    typeFilter,
    accountFilter,
    budgetFilter,
    minAmount,
    maxAmount,
    occasionalFilter,
  ]);

  const changeMonth = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const nextMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!requestedMonth && !budgetFilter) {
      setLocalMonth(nextMonth);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("month", nextMonth);
    params.delete("budget");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const clearBudgetFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("budget");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const clearAllFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setOccasionalFilter("all");
    setAccountFilter("");
    setMinAmount("");
    setMaxAmount("");
    clearBudgetFilter();
  };

  const handleEdit = (transaction: TransactionWithRelations) => {
    setEditingTransaction(transaction);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingTransaction(null);
  };

  const handleAccept = async (transaction: TransactionWithRelations) => {
    try {
      await updateTransaction(transaction.id, { status: "confirmed" });
      toast.success("Movimiento confirmado");
    } catch {
      toast.error("No se pudo confirmar el movimiento");
    }
  };

  const handleDiscard = async (transaction: TransactionWithRelations) => {
    try {
      await deleteTransaction(transaction.id);
      toast.success("Movimiento descartado");
    } catch {
      toast.error("No se pudo descartar el movimiento");
    }
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
          <div className="flex items-center gap-2">
            <MonthPager month={month} onChange={changeMonth} />
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo
            </Button>
          </div>
        }
      />

      <div className="app-shell page-stack">
        {pendingTransactions.length > 0 && (
          <PendingTransactionList
            transactions={pendingTransactions}
            onEdit={handleEdit}
            onAccept={handleAccept}
            onDiscard={handleDiscard}
          />
        )}

        {transactions.length > 0 && (
          <div className="space-y-2">
            {budgetFilter ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
                <p className="min-w-0 text-xs text-muted-foreground">
                  Mostrando gastos del presupuesto seleccionado
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 shrink-0"
                  onClick={clearBudgetFilter}
                >
                  Quitar filtro
                </Button>
              </div>
            ) : null}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descripción, categoría, cuenta..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 pl-9 pr-12"
              />
              {search && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setSearch("")}
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                className="h-11 px-3 text-xs shrink-0 gap-1"
                aria-expanded={showFilters}
                aria-controls="transaction-filters"
                onClick={() => setShowFilters((v) => !v)}
              >
                <Filter className="h-3.5 w-3.5" />
                Filtros
                {hasActiveFilters && (
                  <Badge className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>

            {showFilters && (
              <div
                id="transaction-filters"
                className="rounded-lg border border-border/60 p-3 space-y-3"
              >
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Tipo
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(
                      [
                        ["all", "Todos"],
                        ["expense", "Gastos"],
                        ["income", "Ingresos"],
                        ["transfer", "Transferencias"],
                      ] as const
                    ).map(([value, label]) => (
                      <Button
                        key={value}
                        variant={typeFilter === value ? "default" : "outline"}
                        size="sm"
                        className="h-11 px-3 text-xs"
                        onClick={() => setTypeFilter(value)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Frecuencia
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(
                      [
                        ["all", "Todas"],
                        ["occasional", "Ocasionales"],
                        ["recurring", "Recurrentes"],
                      ] as const
                    ).map(([value, label]) => (
                      <Button
                        key={value}
                        variant={
                          occasionalFilter === value ? "default" : "outline"
                        }
                        size="sm"
                        className="h-11 px-3 text-xs"
                        onClick={() => setOccasionalFilter(value)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Cuenta
                  </p>
                  <Select
                    value={accountFilter}
                    onValueChange={(v) => setAccountFilter(v ?? "")}
                  >
                    <SelectTrigger className="h-11 text-xs">
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
                    <p className="text-xs font-medium text-muted-foreground">
                      Monto mínimo
                    </p>
                    <Input
                      type="number"
                      placeholder="0"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="h-11 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Monto máximo
                    </p>
                    <Input
                      type="number"
                      placeholder="Sin límite"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="h-11 text-xs"
                    />
                  </div>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-11 text-xs w-full"
                    onClick={clearAllFilters}
                  >
                    Limpiar todo
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="section-card h-16 animate-pulse" />
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
            <p className="font-medium text-foreground">
              Sin movimientos en {formatMonthYear(`${month}-01`)}
            </p>
            <p className="text-xs mt-1">
              Registra un ingreso, gasto o transferencia para comenzar a
              rastrear tus finanzas
            </p>
            <Button className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Registrar primer movimiento
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {error ? (
              <div className="section-card p-3">
                <p className="text-sm font-medium">
                  Error al actualizar movimientos
                </p>
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
                <p className="text-xs mt-1">
                  Intenta con otro filtro o busqueda
                </p>
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
        initialMonth={month}
      />
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="app-shell py-6 text-sm text-muted-foreground">
          Cargando movimientos...
        </div>
      }
    >
      <TransactionsPageContent />
    </Suspense>
  );
}
