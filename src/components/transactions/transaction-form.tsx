"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import useSWR from "swr";
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
import { Checkbox } from "@/components/ui/checkbox";
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

function isLiquidAccount(account: Account) {
  return account.type === "savings" || account.type === "cash";
}

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
  onSubmitShared: (
    data: Omit<Transaction, "id" | "created_at">,
    splitBetween: number
  ) => Promise<void>;
  onUpdate?: (
    id: string,
    data: Partial<Omit<Transaction, "id" | "created_at">>
  ) => Promise<void>;
  accounts: Account[];
  editTransaction?: (Transaction & { categories?: Category | null }) | null;
}

interface TransactionFormValues {
  type: TransactionType;
  amount: string;
  description: string;
  date: string;
  categoryId: string;
  budgetId: string;
  accountId: string;
  toAccountId: string;
  isDebtPayment: boolean;
  isSharedExpense: boolean;
  splitBetween: number;
  tags: string;
}

function getDefaultValues(
  editTransaction?: (Transaction & { categories?: Category | null }) | null
): TransactionFormValues {
  if (!editTransaction) {
    return {
      type: "expense",
      amount: "",
      description: "",
      date: getTodayLocalDate(),
      categoryId: "",
      budgetId: "",
      accountId: "",
      toAccountId: "",
      isDebtPayment: false,
      isSharedExpense: false,
      splitBetween: 2,
      tags: "",
    };
  }

  return {
    type: editTransaction.type,
    amount: formatIntegerInput(String(editTransaction.amount)),
    description: editTransaction.description ?? "",
    date: editTransaction.date,
    categoryId: editTransaction.category_id ?? "",
    budgetId: editTransaction.budget_id ?? "",
    accountId: editTransaction.account_id,
    toAccountId: editTransaction.to_account_id ?? "",
    isDebtPayment:
      editTransaction.type === "expense" && !!editTransaction.to_account_id,
    isSharedExpense: false,
    splitBetween: 2,
    tags: (editTransaction.tags ?? []).join(", "),
  };
}

export function TransactionForm({
  open,
  onOpenChange,
  onSubmit,
  onSubmitShared,
  onUpdate,
  accounts,
  editTransaction,
}: TransactionFormProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<TransactionFormValues>({
    defaultValues: getDefaultValues(editTransaction),
  });

  const watchedType = useWatch({ control, name: "type" });
  const watchedAmount = useWatch({ control, name: "amount" });
  const watchedDate = useWatch({ control, name: "date" });
  const watchedCategoryId = useWatch({ control, name: "categoryId" });
  const watchedBudgetId = useWatch({ control, name: "budgetId" });
  const watchedAccountId = useWatch({ control, name: "accountId" });
  const watchedToAccountId = useWatch({ control, name: "toAccountId" });
  const watchedIsDebtPayment = useWatch({ control, name: "isDebtPayment" });
  const watchedIsSharedExpense = useWatch({ control, name: "isSharedExpense" });
  const watchedSplitBetween = useWatch({ control, name: "splitBetween" });

  const type = watchedType ?? "expense";
  const amount = watchedAmount ?? "";
  const date = watchedDate ?? getTodayLocalDate();
  const categoryId = watchedCategoryId ?? "";
  const budgetId = watchedBudgetId ?? "";
  const accountId = watchedAccountId ?? "";
  const toAccountId = watchedToAccountId ?? "";
  const isDebtPayment = watchedIsDebtPayment ?? false;
  const isSharedExpense = watchedIsSharedExpense ?? false;
  const splitBetween = watchedSplitBetween ?? 2;

  const previousTypeRef = useRef<TransactionType | null>(null);
  const hydratedBudgetFromEditRef = useRef(false);
  const { categories: incomeCategories } = useCategories("income");
  const isEditing = !!editTransaction;

  const selectedMonth = useMemo(() => {
    if (date.length >= 7) {
      return date.slice(0, 7);
    }

    return getTodayLocalDate().slice(0, 7);
  }, [date]);

  const fetchBudgets = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("budgets")
      .select("*, categories(*)")
      .eq("month", `${selectedMonth}-01`);

    return (data as BudgetWithCategory[]) ?? [];
  }, [selectedMonth]);

  const { data: budgets = [], isLoading: loadingBudgets } = useSWR(
    ["budgets-options", selectedMonth],
    fetchBudgets
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextValues = getDefaultValues(editTransaction);
    previousTypeRef.current = nextValues.type;
    hydratedBudgetFromEditRef.current = false;
    reset(nextValues);
  }, [open, editTransaction, reset]);

  useEffect(() => {
    if (loadingBudgets) {
      return;
    }

    if (budgetId && !budgets.some((b) => b.id === budgetId)) {
      setValue("budgetId", "");
    }
  }, [budgetId, budgets, loadingBudgets, setValue]);

  useEffect(() => {
    if (!open || !isEditing || hydratedBudgetFromEditRef.current) {
      return;
    }

    if (type !== "expense") {
      hydratedBudgetFromEditRef.current = true;
      return;
    }

    if (loadingBudgets) {
      return;
    }

    if (budgetId) {
      hydratedBudgetFromEditRef.current = true;
      return;
    }

    const editCategoryId = editTransaction?.category_id;
    if (!editCategoryId) {
      hydratedBudgetFromEditRef.current = true;
      return;
    }

    const matchingBudgets = budgets.filter((b) => b.category_id === editCategoryId);

    if (matchingBudgets.length === 1) {
      setValue("budgetId", matchingBudgets[0].id);
    }

    hydratedBudgetFromEditRef.current = true;
  }, [
    budgets,
    editTransaction?.category_id,
    isEditing,
    loadingBudgets,
    open,
    setValue,
    type,
    budgetId,
  ]);

  const liquidAccounts = useMemo(
    () => accounts.filter(isLiquidAccount),
    [accounts]
  );

  const expenseOriginAccounts = useMemo(
    () => accounts.filter((a) => a.type !== "loan"),
    [accounts]
  );

  const originAccounts =
    type === "income" || type === "transfer"
      ? liquidAccounts
      : expenseOriginAccounts;

  const destinationAccounts = useMemo(
    () => liquidAccounts.filter((a) => a.id !== accountId),
    [liquidAccounts, accountId]
  );

  const debtAccounts = useMemo(
    () =>
      accounts.filter((a) => a.type === "credit_card" || a.type === "loan"),
    [accounts]
  );

  useEffect(() => {
    if (accountId && !originAccounts.some((a) => a.id === accountId)) {
      setValue("accountId", "");
    }
  }, [accountId, originAccounts, setValue]);

  useEffect(() => {
    const allowedDestinations =
      type === "expense" && isDebtPayment ? debtAccounts : destinationAccounts;

    if (toAccountId && !allowedDestinations.some((a) => a.id === toAccountId)) {
      setValue("toAccountId", "");
    }
  }, [
    debtAccounts,
    destinationAccounts,
    isDebtPayment,
    setValue,
    toAccountId,
    type,
  ]);

  useEffect(() => {
    if (!type) {
      return;
    }

    if (previousTypeRef.current === null) {
      previousTypeRef.current = type;
      return;
    }

    if (previousTypeRef.current === type) {
      return;
    }

    previousTypeRef.current = type;

    if (type !== "income" && categoryId) {
      setValue("categoryId", "");
    }

    if (type !== "expense" && budgetId) {
      setValue("budgetId", "");
    }

    if (type !== "transfer" && type !== "expense") {
      setValue("toAccountId", "");
    }

    setValue("isDebtPayment", false);
    setValue("isSharedExpense", false);
    setValue("splitBetween", 2);
  }, [budgetId, categoryId, setValue, type]);

  const selectedBudget = budgets.find((b) => b.id === budgetId);
  const getBudgetLabel = useCallback((budget: BudgetWithCategory) => {
    const categoryLabel = budget.categories?.name ?? "Sin categoria";
    return `${budget.name} · ${categoryLabel}`;
  }, []);
  const selectedIncomeCategory = incomeCategories.find((c) => c.id === categoryId);
  const selectedOriginAccount = originAccounts.find((a) => a.id === accountId);
  const selectedDebtAccount = debtAccounts.find((a) => a.id === toAccountId);
  const selectedDestinationAccount =
    type === "expense"
      ? selectedDebtAccount
      : destinationAccounts.find((a) => a.id === toAccountId);

  const hasValidDestination = isDestinationSelectionValid(
    type,
    accountId,
    toAccountId
  );

  const canSave = !isSubmitting && !!amount && !!accountId && hasValidDestination;

  const onFormSubmit = async (values: TransactionFormValues) => {
    const transaction = {
      type: values.type,
      amount: parseIntegerInput(values.amount),
      description: values.description || null,
      date: values.date,
      budget_id: values.type === "expense" ? values.budgetId || null : null,
      category_id:
        values.type === "expense"
          ? selectedBudget?.category_id ?? null
          : values.type === "income"
            ? values.categoryId || null
            : null,
      account_id: values.accountId,
      related_expense_id: isEditing ? (editTransaction?.related_expense_id ?? null) : null,
      to_account_id:
        values.type === "transfer" || values.type === "expense"
          ? values.toAccountId || null
          : null,
      tags: values.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      if (isEditing && onUpdate) {
        await onUpdate(editTransaction!.id, transaction);
        toast.success("Movimiento actualizado");
      } else if (!isEditing && values.isSharedExpense && values.type === "expense") {
        await onSubmitShared(transaction, values.splitBetween);
        toast.success("Gasto compartido registrado");
      } else {
        await onSubmit(transaction);
        toast.success("Movimiento registrado");
      }
      reset(getDefaultValues());
      onOpenChange(false);
    } catch {
      toast.error("No se pudo guardar el movimiento");
    }
  };

  const typeLabels: Record<TransactionType, string> = {
    expense: "Gasto",
    income: "Ingreso",
    transfer: "Transferencia",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar movimiento" : "Nuevo movimiento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-1.5">
            {(
              ["expense", "income", "transfer"] as TransactionType[]
            ).map((t) => (
              <Button
                key={t}
                type="button"
                variant={type === t ? "default" : "outline"}
                className="h-11 text-sm font-medium"
                onClick={() => setValue("type", t)}
              >
                {typeLabels[t]}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto (COP)</Label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <Input
                  id="amount"
                  type="text"
                  inputMode="numeric"
                  value={field.value}
                  onChange={(e) =>
                    field.onChange(formatIntegerInput(e.target.value))
                  }
                  placeholder="50.000"
                  required
                  className="text-2xl font-bold h-14"
                />
              )}
            />
          </div>

          {type === "expense" && (
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (opcional)</Label>
              <Controller
                name="budgetId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v ?? "")}
                  >
                      <SelectTrigger id="budget" className="w-full">
                        <SelectValue placeholder="Sin budget">
                          {() =>
                            selectedBudget ? getBudgetLabel(selectedBudget) : "Sin budget"
                          }
                        </SelectValue>
                      </SelectTrigger>
                    <SelectContent className="w-[min(92vw,34rem)] min-w-[var(--anchor-width)]">
                      <SelectItem value="" label="Sin budget">
                        Sin budget
                      </SelectItem>
                      {loadingBudgets ? (
                        <SelectItem value="__loading" disabled>
                          Cargando budgets...
                        </SelectItem>
                        ) : (
                        budgets.map((b) => {
                          const budgetLabel = getBudgetLabel(b);

                          return (
                            <SelectItem key={b.id} value={b.id} label={budgetLabel}>
                              {budgetLabel}
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {type === "income" && (
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v ?? "")}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecciona categoria">
                        {() => selectedIncomeCategory?.name ?? "Selecciona categoria"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {incomeCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id} label={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="account">
              {type === "transfer"
                ? "Cuenta origen"
                : type === "expense"
                  ? "Cuenta para pagar"
                  : "Cuenta"}
            </Label>
            <Controller
              name="accountId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v ?? "")}
                >
                  <SelectTrigger id="account">
                    <SelectValue placeholder="Selecciona cuenta">
                      {() => selectedOriginAccount?.name ?? "Selecciona cuenta"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {originAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id} label={a.name}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {type === "expense" && (
            <div className="space-y-3">
              <label
                htmlFor="isDebtPayment"
                className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-3 cursor-pointer transition-colors hover:bg-muted/50"
              >
                <Controller
                  name="isDebtPayment"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="isDebtPayment"
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        const nextChecked = !!checked;
                        field.onChange(nextChecked);

                        if (!nextChecked) {
                          setValue("toAccountId", "");
                        }

                        if (nextChecked) {
                          setValue("isSharedExpense", false);
                          setValue("splitBetween", 2);
                        }
                      }}
                    />
                  )}
                />
                <span className="text-sm">Es pago de deuda</span>
              </label>

              {isDebtPayment && (
                <div className="space-y-2">
                  <Label htmlFor="debtAccount">Deuda a pagar</Label>
                  <Controller
                    name="toAccountId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(v) => field.onChange(v ?? "")}
                      >
                        <SelectTrigger id="debtAccount">
                          <SelectValue placeholder="Selecciona deuda">
                            {() => selectedDebtAccount?.name ?? "Selecciona deuda"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {debtAccounts.map((a) => (
                            <SelectItem key={a.id} value={a.id} label={a.name}>
                              {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}

              {!isEditing && (
                <>
                  <label
                    htmlFor="isSharedExpense"
                    className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-3 cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <Controller
                      name="isSharedExpense"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="isSharedExpense"
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            const nextChecked = !!checked;
                            field.onChange(nextChecked);

                            if (nextChecked) {
                              setValue("isDebtPayment", false);
                              setValue("toAccountId", "");
                            }

                            if (!nextChecked) {
                              setValue("splitBetween", 2);
                            }
                          }}
                        />
                      )}
                    />
                    <span className="text-sm">Gasto compartido</span>
                  </label>

                  {isSharedExpense && (
                    <div className="space-y-2">
                      <Label htmlFor="splitBetween">Dividir entre</Label>
                      <Controller
                        name="splitBetween"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="splitBetween"
                            type="number"
                            min={2}
                            max={10}
                            value={field.value}
                            onChange={(e) =>
                              field.onChange(
                                Math.max(
                                  2,
                                  Math.min(10, Number(e.target.value) || 2)
                                )
                              )
                            }
                          />
                        )}
                      />

                      {amount && (
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p>
                            Tu parte:{" "}
                            {formatIntegerInput(
                              String(
                                Math.floor(parseIntegerInput(amount) / splitBetween)
                              )
                            )}
                          </p>
                          <p>
                            Reembolso:{" "}
                            {formatIntegerInput(
                              String(
                                parseIntegerInput(amount) -
                                  Math.floor(parseIntegerInput(amount) / splitBetween)
                              )
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {type === "transfer" && (
            <div className="space-y-2">
              <Label htmlFor="toAccount">Cuenta destino</Label>
              <Controller
                name="toAccountId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v ?? "")}
                  >
                    <SelectTrigger id="toAccount">
                      <SelectValue placeholder="Selecciona cuenta destino">
                        {() =>
                          selectedDestinationAccount?.name ??
                          "Selecciona cuenta destino"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {destinationAccounts.map((a) => (
                        <SelectItem key={a.id} value={a.id} label={a.name}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {(type === "income" || type === "transfer") &&
            liquidAccounts.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No hay cuentas de ahorro o efectivo disponibles
              </p>
            )}

          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input id="date" type="date" {...register("date")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripcion (opcional)</Label>
            <Input
              id="description"
              {...register("description")}
              placeholder="Ej: Almuerzo en restaurante"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Etiquetas (opcional)</Label>
            <Input
              id="tags"
              {...register("tags")}
              placeholder="Ej: trabajo, ocio, fijo"
            />
            <p className="text-xs text-muted-foreground">Separa con comas</p>
          </div>

          <Button type="submit" className="w-full" disabled={!canSave}>
            {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
