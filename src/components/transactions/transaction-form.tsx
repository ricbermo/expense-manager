"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { useCategories } from "@/lib/hooks/use-categories";
import {
  formatIntegerInput,
  parseIntegerInput,
} from "@/lib/utils/number-input-format";
import { isDestinationSelectionValid } from "@/lib/utils/transaction-destination-rules";
import type {
  Account,
  Budget,
  Category,
  Transaction,
  TransactionType,
} from "@/lib/types/database";

type BudgetWithCategory = Budget & { categories: Category | null };

function getTodayLocalDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Transaction, "id" | "created_at">) => Promise<void>;
  accounts: Account[];
}

export function TransactionForm({
  open,
  onOpenChange,
  onSubmit,
  accounts,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(getTodayLocalDate);
  const [categoryId, setCategoryId] = useState("");
  const [budgetId, setBudgetId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);
  const [saving, setSaving] = useState(false);

  const { categories: incomeCategories } = useCategories("income");

  const selectedMonth = useMemo(() => {
    if (date.length >= 7) {
      return `${date.slice(0, 7)}-01`;
    }
    return `${getTodayLocalDate().slice(0, 7)}-01`;
  }, [date]);

  useEffect(() => {
    if (open) {
      setDate(getTodayLocalDate());
    }
  }, [open]);

  useEffect(() => {
    let cancelled = false;

    const fetchBudgets = async () => {
      setLoadingBudgets(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("budgets")
          .select("*, categories(*)")
          .eq("month", selectedMonth);

        if (!cancelled) {
          setBudgets((data as BudgetWithCategory[]) ?? []);
        }
      } finally {
        if (!cancelled) {
          setLoadingBudgets(false);
        }
      }
    };

    fetchBudgets();

    return () => {
      cancelled = true;
    };
  }, [selectedMonth]);

  useEffect(() => {
    if (budgetId && !budgets.some((b) => b.id === budgetId)) {
      setBudgetId("");
    }
  }, [budgetId, budgets]);

  const savingsAccounts = useMemo(
    () => accounts.filter((a) => a.type === "savings"),
    [accounts]
  );

  const originAccounts =
    type === "income" || type === "transfer" || type === "payment"
      ? savingsAccounts
      : accounts;

  const destinationAccounts = useMemo(
    () => savingsAccounts.filter((a) => a.id !== accountId),
    [savingsAccounts, accountId]
  );

  useEffect(() => {
    if (accountId && !originAccounts.some((a) => a.id === accountId)) {
      setAccountId("");
    }
  }, [accountId, originAccounts]);

  useEffect(() => {
    if (toAccountId && !destinationAccounts.some((a) => a.id === toAccountId)) {
      setToAccountId("");
    }
  }, [toAccountId, destinationAccounts]);

  useEffect(() => {
    if (type !== "income" && categoryId) {
      setCategoryId("");
    }
    if (type !== "expense" && budgetId) {
      setBudgetId("");
    }
    if (type !== "transfer" && type !== "payment" && toAccountId) {
      setToAccountId("");
    }
  }, [type, categoryId, budgetId, toAccountId]);

  const selectedBudget = budgets.find((b) => b.id === budgetId);
  const requiresBudget = type === "expense";
  const hasValidBudget = !requiresBudget || !!selectedBudget;
  const hasValidDestination = isDestinationSelectionValid(
    type,
    accountId,
    toAccountId
  );
  const canSave =
    !saving &&
    !!amount &&
    !!accountId &&
    hasValidBudget &&
    hasValidDestination;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        type,
        amount: parseIntegerInput(amount),
        description: description || null,
        date,
        category_id:
          type === "expense"
            ? selectedBudget?.category_id ?? null
            : type === "income"
              ? categoryId || null
              : null,
        account_id: accountId,
        to_account_id:
          type === "transfer" || type === "payment"
            ? toAccountId || null
            : null,
      });
      onOpenChange(false);
      // Reset form
      setAmount("");
      setDescription("");
      setCategoryId("");
      setBudgetId("");
      setToAccountId("");
      setDate(getTodayLocalDate());
    } finally {
      setSaving(false);
    }
  };

  const typeLabels: Record<TransactionType, string> = {
    expense: "Gasto",
    income: "Ingreso",
    transfer: "Transferencia",
    payment: "Pago",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo movimiento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 gap-1">
            {(
              ["expense", "income", "transfer", "payment"] as TransactionType[]
            ).map((t) => (
              <Button
                key={t}
                type="button"
                variant={type === t ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setType(t)}
              >
                {typeLabels[t]}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto (COP)</Label>
            <Input
              id="amount"
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(formatIntegerInput(e.target.value))}
              placeholder="50.000"
              required
              className="text-2xl font-bold h-14"
            />
          </div>

          {type === "expense" && (
            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Select value={budgetId} onValueChange={(v) => setBudgetId(v ?? "")}> 
                <SelectTrigger id="budget">
                  <SelectValue placeholder="Selecciona budget" />
                </SelectTrigger>
                <SelectContent>
                  {loadingBudgets ? (
                    <SelectItem value="__loading" disabled>
                      Cargando budgets...
                    </SelectItem>
                  ) : budgets.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                      No hay budgets para este mes
                    </SelectItem>
                  ) : (
                    budgets.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.categories?.name ?? "Sin categoria"}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "income" && (
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecciona categoria" />
                </SelectTrigger>
                <SelectContent>
                  {incomeCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="account">
              {type === "transfer" || type === "payment"
                ? "Cuenta origen"
                : "Cuenta"}
            </Label>
            <Select value={accountId} onValueChange={(v) => setAccountId(v ?? "")}>
              <SelectTrigger id="account">
                <SelectValue placeholder="Selecciona cuenta" />
              </SelectTrigger>
              <SelectContent>
                {originAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(type === "transfer" || type === "payment") && (
            <div className="space-y-2">
              <Label htmlFor="toAccount">Cuenta destino (opcional)</Label>
              <Select value={toAccountId} onValueChange={(v) => setToAccountId(v ?? "")}>
                <SelectTrigger id="toAccount">
                  <SelectValue placeholder="Selecciona cuenta destino o dejalo vacio" />
                </SelectTrigger>
                <SelectContent>
                  {destinationAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(type === "income" || type === "transfer" || type === "payment") &&
            savingsAccounts.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No hay cuentas de ahorro disponibles
              </p>
            )}

          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripcion (opcional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Almuerzo en restaurante"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!canSave}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
