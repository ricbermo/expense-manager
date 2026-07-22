"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/lib/hooks/use-categories";
import { createClient } from "@/lib/supabase/client";
import type {
  Account,
  Budget,
  Category,
  Transaction,
  TransactionStatus,
  TransactionType,
} from "@/lib/types/database";
import {
  formatIntegerInput,
  parseIntegerInput,
} from "@/lib/utils/number-input-format";
import { isDestinationSelectionValid } from "@/lib/utils/transaction-destination-rules";
import { shouldShowTransactionDetails } from "@/lib/utils/transaction-form-details";

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

function getNewTransactionDate(initialMonth?: string) {
  return !initialMonth || initialMonth === getTodayLocalDate().slice(0, 7)
    ? getTodayLocalDate()
    : `${initialMonth}-01`;
}

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    data: Omit<Transaction, "id" | "created_at" | "status"> & {
      status?: TransactionStatus;
    },
  ) => Promise<void>;
  onSubmitShared: (
    data: Omit<Transaction, "id" | "created_at" | "status"> & {
      status?: TransactionStatus;
    },
    splitBetween: number,
  ) => Promise<void>;
  onUpdate?: (
    id: string,
    data: Partial<Omit<Transaction, "id" | "created_at">>,
  ) => Promise<void>;
  accounts: Account[];
  editTransaction?: (Transaction & { categories?: Category | null }) | null;
  initialMonth?: string;
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
  installments: string;
  isOccasional: boolean;
}

const INSTALLMENT_OPTIONS = [1, 3, 6, 9, 12, 18, 24, 36, 48];

function getDefaultValues(
  editTransaction?: (Transaction & { categories?: Category | null }) | null,
  initialMonth?: string,
): TransactionFormValues {
  if (!editTransaction) {
    return {
      type: "expense",
      amount: "",
      description: "",
      date: getNewTransactionDate(initialMonth),
      categoryId: "",
      budgetId: "",
      accountId: "",
      toAccountId: "",
      isDebtPayment: false,
      isSharedExpense: false,
      splitBetween: 2,
      tags: "",
      installments: "1",
      isOccasional: false,
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
    installments: editTransaction.installments
      ? String(editTransaction.installments)
      : "1",
    isOccasional: editTransaction.is_occasional ?? false,
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
  initialMonth,
}: TransactionFormProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<TransactionFormValues>({
    defaultValues: getDefaultValues(editTransaction, initialMonth),
  });
  const [showDetails, setShowDetails] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [saveAndAddAnother, setSaveAndAddAnother] = useState(false);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const lastAccountIdRef = useRef<string | null>(null);

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
  const watchedInstallments = useWatch({ control, name: "installments" });

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
  const installments = watchedInstallments ?? "";

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
    fetchBudgets,
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextValues = getDefaultValues(editTransaction, initialMonth);
    if (!editTransaction && lastAccountIdRef.current) {
      nextValues.accountId = lastAccountIdRef.current;
    }
    previousTypeRef.current = nextValues.type;
    hydratedBudgetFromEditRef.current = false;
    setShowDetails(
      editTransaction
        ? shouldShowTransactionDetails({
            type: editTransaction.type,
            budget_id: editTransaction.budget_id,
            category_id: editTransaction.category_id,
            description: editTransaction.description,
            tags: editTransaction.tags,
            to_account_id: editTransaction.to_account_id,
            installments: editTransaction.installments,
            is_occasional: editTransaction.is_occasional,
            is_debt_payment:
              editTransaction.type === "expense" &&
              !!editTransaction.to_account_id,
          })
        : false,
    );
    setSubmitAttempted(false);
    setSaveAndAddAnother(false);
    reset(nextValues);
  }, [open, editTransaction, initialMonth, reset]);

  useEffect(() => {
    if (!open || isEditing) return;

    const frame = requestAnimationFrame(() => amountInputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isEditing, open]);

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

    const matchingBudgets = budgets.filter(
      (b) => b.category_id === editCategoryId,
    );

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
    [accounts],
  );

  const expenseOriginAccounts = useMemo(
    () => accounts.filter((a) => a.type !== "loan"),
    [accounts],
  );

  const originAccounts =
    type === "income" || type === "transfer"
      ? liquidAccounts
      : expenseOriginAccounts;

  const destinationAccounts = useMemo(
    () => liquidAccounts.filter((a) => a.id !== accountId),
    [liquidAccounts, accountId],
  );

  const debtAccounts = useMemo(
    () => accounts.filter((a) => a.type === "credit_card" || a.type === "loan"),
    [accounts],
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
    setValue("installments", "1");
  }, [budgetId, categoryId, setValue, type]);

  const selectedBudget = budgets.find((b) => b.id === budgetId);
  const getBudgetLabel = useCallback((budget: BudgetWithCategory) => {
    const categoryLabel = budget.categories?.name ?? "Sin categoría";
    return `${budget.name} · ${categoryLabel}`;
  }, []);
  const selectedIncomeCategory = incomeCategories.find(
    (c) => c.id === categoryId,
  );
  const selectedOriginAccount = originAccounts.find((a) => a.id === accountId);
  const selectedDebtAccount = debtAccounts.find((a) => a.id === toAccountId);
  const selectedDestinationAccount =
    type === "expense"
      ? selectedDebtAccount
      : destinationAccounts.find((a) => a.id === toAccountId);

  const hasValidDestination = isDestinationSelectionValid(
    type,
    accountId,
    toAccountId,
  );

  const isCreditCardPurchase =
    type === "expense" &&
    !isDebtPayment &&
    selectedOriginAccount?.type === "credit_card";

  useEffect(() => {
    if (!isCreditCardPurchase && installments !== "1") {
      setValue("installments", "1");
    }
  }, [isCreditCardPurchase, installments, setValue]);

  const hasRequiredValues = !!amount && !!accountId && hasValidDestination;
  const canSave = !isSubmitting && hasRequiredValues;

  const resetForNewTransaction = () => {
    const nextValues = getDefaultValues(null, initialMonth);
    if (lastAccountIdRef.current) {
      nextValues.accountId = lastAccountIdRef.current;
    }
    reset(nextValues);
  };

  const onFormSubmit = async (values: TransactionFormValues) => {
    const hasValidSubmission =
      !!values.amount &&
      !!values.accountId &&
      isDestinationSelectionValid(
        values.type,
        values.accountId,
        values.toAccountId,
      );

    if (!hasValidSubmission) {
      setSubmitAttempted(true);
      return;
    }

    const debtAccount = debtAccounts.find((a) => a.id === values.toAccountId);
    const isCreditCardPayment =
      values.type === "expense" &&
      values.isDebtPayment &&
      debtAccount?.type === "credit_card";

    const effectiveType: TransactionType = isCreditCardPayment
      ? "transfer"
      : values.type;

    const originAccount = accounts.find((a) => a.id === values.accountId);
    const installmentsValue =
      effectiveType === "expense" &&
      !values.isDebtPayment &&
      originAccount?.type === "credit_card" &&
      values.installments
        ? Number(values.installments)
        : null;

    const transaction = {
      type: effectiveType,
      amount: parseIntegerInput(values.amount),
      description: values.description || null,
      date: values.date,
      budget_id: effectiveType === "expense" ? values.budgetId || null : null,
      category_id:
        effectiveType === "expense"
          ? (selectedBudget?.category_id ?? null)
          : effectiveType === "income"
            ? values.categoryId || null
            : null,
      account_id: values.accountId,
      related_expense_id: isEditing
        ? (editTransaction?.related_expense_id ?? null)
        : null,
      to_account_id:
        effectiveType === "transfer" || effectiveType === "expense"
          ? values.toAccountId || null
          : null,
      tags: values.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      installments: installmentsValue,
      is_occasional: effectiveType === "expense" ? values.isOccasional : false,
      status: (isEditing && editTransaction?.status === "pending"
        ? "confirmed"
        : undefined) as TransactionStatus | undefined,
    };

    try {
      lastAccountIdRef.current = values.accountId;
      if (isEditing && onUpdate && editTransaction) {
        await onUpdate(editTransaction.id, transaction);
        toast.success("Movimiento actualizado");
      } else if (
        !isEditing &&
        values.isSharedExpense &&
        values.type === "expense"
      ) {
        await onSubmitShared(transaction, values.splitBetween);
        toast.success("Gasto compartido registrado");
      } else {
        await onSubmit(transaction);
        toast.success("Movimiento registrado");
      }
      if (saveAndAddAnother && !isEditing) {
        resetForNewTransaction();
        setShowDetails(false);
        setSubmitAttempted(false);
        setSaveAndAddAnother(false);
      } else {
        resetForNewTransaction();
        onOpenChange(false);
      }
    } catch {
      toast.error("No se pudo guardar el movimiento");
    }
  };

  const typeLabels: Record<TransactionType, string> = {
    expense: "Gasto",
    income: "Ingreso",
    transfer: "Transferencia",
  };

  const submitLabel = isEditing
    ? "Actualizar"
    : `Guardar ${typeLabels[type].toLowerCase()}`;

  const submitForm = handleSubmit(onFormSubmit, () => {
    setSubmitAttempted(true);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar movimiento" : "Nuevo movimiento"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submitForm} className="space-y-4">
          <div className="grid grid-cols-3 gap-1.5">
            {(["expense", "income", "transfer"] as TransactionType[]).map(
              (t) => (
                <Button
                  key={t}
                  type="button"
                  variant={type === t ? "default" : "outline"}
                  className="h-11 text-sm font-medium"
                  onClick={() => {
                    setValue("type", t);
                    if (t !== "expense") {
                      setShowDetails(true);
                    }
                  }}
                >
                  {typeLabels[t]}
                </Button>
              ),
            )}
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
                  ref={(element) => {
                    field.ref(element);
                    amountInputRef.current = element;
                  }}
                  onChange={(e) =>
                    field.onChange(formatIntegerInput(e.target.value))
                  }
                  placeholder="50.000"
                  aria-required="true"
                  className="text-2xl font-bold h-14"
                />
              )}
            />
          </div>

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
                  <SelectTrigger id="account" className="h-11">
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

          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              className="h-11"
              {...register("date")}
            />
          </div>

          {submitAttempted && !canSave && (
            <div role="alert" className="space-y-1 text-xs text-destructive">
              {(!amount || !accountId) && (
                <p>Completa monto y cuenta antes de guardar.</p>
              )}
              {!hasValidDestination && toAccountId && (
                <p>
                  La cuenta destino debe ser distinta a la cuenta de origen.
                </p>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
            onClick={() => setSaveAndAddAnother(false)}
          >
            {isSubmitting ? "Guardando..." : submitLabel}
          </Button>

          {!isEditing && (
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={isSubmitting}
              onClick={() => setSaveAndAddAnother(true)}
            >
              Guardar y añadir otro
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            aria-expanded={showDetails}
            aria-controls="transaction-details"
            onClick={() => setShowDetails((visible) => !visible)}
          >
            {showDetails ? "Ocultar detalles" : "Más detalles"}
          </Button>

          {showDetails && (
            <div id="transaction-details" className="space-y-4">
              {type === "expense" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Presupuesto (opcional)</Label>
                    <Controller
                      name="budgetId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(v) => field.onChange(v ?? "")}
                        >
                          <SelectTrigger id="budget" className="w-full">
                            <SelectValue placeholder="Sin presupuesto">
                              {() =>
                                selectedBudget
                                  ? getBudgetLabel(selectedBudget)
                                  : "Sin presupuesto"
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="w-[min(92vw,34rem)] min-w-[var(--anchor-width)]">
                            <SelectItem value="" label="Sin presupuesto">
                              Sin presupuesto
                            </SelectItem>
                            {loadingBudgets ? (
                              <SelectItem value="__loading" disabled>
                                Cargando presupuestos...
                              </SelectItem>
                            ) : (
                              budgets.map((b) => {
                                const budgetLabel = getBudgetLabel(b);

                                return (
                                  <SelectItem
                                    key={b.id}
                                    value={b.id}
                                    label={budgetLabel}
                                  >
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
                    <div>
                      <span className="text-sm">Es pago de deuda</span>
                      <p className="text-xs text-muted-foreground">
                        Registra el pago como movimiento hacia una deuda.
                      </p>
                    </div>
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
                                {() =>
                                  selectedDebtAccount?.name ??
                                  "Selecciona deuda"
                                }
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {debtAccounts.map((a) => (
                                <SelectItem
                                  key={a.id}
                                  value={a.id}
                                  label={a.name}
                                >
                                  {a.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  )}

                  {isCreditCardPurchase && (
                    <div className="space-y-2">
                      <Label htmlFor="installments">Cuotas</Label>
                      <p className="text-xs text-muted-foreground">
                        El gasto se repartirá entre las cuotas seleccionadas.
                      </p>
                      <Controller
                        name="installments"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value || "1"}
                            onValueChange={(v) => field.onChange(v)}
                          >
                            <SelectTrigger id="installments">
                              <SelectValue>
                                {() => {
                                  const n = Number(field.value || "1");
                                  return n === 1 ? "1 cuota" : `${n} cuotas`;
                                }}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {INSTALLMENT_OPTIONS.map((n) => {
                                const label =
                                  n === 1 ? "1 cuota" : `${n} cuotas`;
                                return (
                                  <SelectItem
                                    key={n}
                                    value={String(n)}
                                    label={label}
                                  >
                                    {label}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {amount && Number(installments) >= 2 && (
                        <p className="text-xs text-muted-foreground">
                          Cuota mensual:{" "}
                          {formatIntegerInput(
                            String(
                              Math.floor(
                                parseIntegerInput(amount) /
                                  Number(installments),
                              ),
                            ),
                          )}
                        </p>
                      )}
                    </div>
                  )}

                  <label
                    htmlFor="isOccasional"
                    className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-3 cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <Controller
                      name="isOccasional"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="isOccasional"
                          checked={field.value}
                          onCheckedChange={(checked) =>
                            field.onChange(!!checked)
                          }
                        />
                      )}
                    />
                    <div>
                      <span className="text-sm">Gasto ocasional</span>
                      <p className="text-xs text-muted-foreground">
                        No se repetirá el próximo mes
                      </p>
                    </div>
                  </label>

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
                        <div>
                          <span className="text-sm">Gasto compartido</span>
                          <p className="text-xs text-muted-foreground">
                            Calcula tu parte y el reembolso esperado.
                          </p>
                        </div>
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
                                      Math.min(10, Number(e.target.value) || 2),
                                    ),
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
                                    Math.floor(
                                      parseIntegerInput(amount) / splitBetween,
                                    ),
                                  ),
                                )}
                              </p>
                              <p>
                                Reembolso:{" "}
                                {formatIntegerInput(
                                  String(
                                    parseIntegerInput(amount) -
                                      Math.floor(
                                        parseIntegerInput(amount) /
                                          splitBetween,
                                      ),
                                  ),
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

              {type === "income" && (
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(v) => field.onChange(v ?? "")}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Selecciona categoría">
                            {() =>
                              selectedIncomeCategory?.name ??
                              "Selecciona categoría"
                            }
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
                              "Selecciona cuenta destino"
                            }
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
                <Label htmlFor="description">Descripción (opcional)</Label>
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
                <p className="text-xs text-muted-foreground">
                  Separa con comas
                </p>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
