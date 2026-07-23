"use client";

import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
import type { StatementWithAccount } from "@/lib/hooks/use-credit-card-statements";
import type { Account } from "@/lib/types/database";
import {
  getStatementPaymentSummary,
  validateStatementPayment,
} from "@/lib/utils/credit-card-statements";
import { formatCOP } from "@/lib/utils/currency";
import {
  formatIntegerInput,
  parseIntegerInput,
} from "@/lib/utils/number-input-format";

interface PaymentFormValues {
  amount: string;
  sourceAccountId: string;
  date: string;
  description: string;
}

interface CreditCardPaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditCardAccount: Account;
  pendingStatement: StatementWithAccount;
  sourceAccounts: Account[];
  onSubmit: (data: {
    amount: number;
    sourceAccountId: string;
    date: string;
    description: string;
    statementId: string;
  }) => Promise<void>;
}

function getTodayLocalDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

export function CreditCardPaymentForm({
  open,
  onOpenChange,
  creditCardAccount,
  pendingStatement,
  sourceAccounts,
  onSubmit,
}: CreditCardPaymentFormProps) {
  const defaultAmount = pendingStatement
    ? formatIntegerInput(String(pendingStatement.minimum_payment))
    : "";

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { isSubmitting, errors },
  } = useForm<PaymentFormValues>({
    defaultValues: {
      amount: defaultAmount,
      sourceAccountId: "",
      date: getTodayLocalDate(),
      description: `Pago ${creditCardAccount.name}`,
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      amount: pendingStatement
        ? formatIntegerInput(String(pendingStatement.minimum_payment))
        : "",
      sourceAccountId: sourceAccounts[0]?.id ?? "",
      date: getTodayLocalDate(),
      description: `Pago ${creditCardAccount.name}`,
    });
  }, [open, pendingStatement, creditCardAccount.name, sourceAccounts, reset]);

  const watchedSourceId = useWatch({ control, name: "sourceAccountId" });
  const watchedAmount = useWatch({ control, name: "amount" });
  const selectedSource = sourceAccounts.find(
    (account) => account.id === watchedSourceId,
  );
  const statementSummary = useMemo(
    () => getStatementPaymentSummary(pendingStatement),
    [pendingStatement],
  );
  const remainingAfterPayment = useMemo(
    () =>
      Math.max(
        0,
        statementSummary.remainingAmount -
          parseIntegerInput(watchedAmount ?? ""),
      ),
    [statementSummary.remainingAmount, watchedAmount],
  );

  const onFormSubmit = async (values: PaymentFormValues) => {
    const amount = parseIntegerInput(values.amount);
    const validationError = validateStatementPayment({
      amount,
      remainingAmount: statementSummary.remainingAmount,
      sourceBalance: selectedSource?.balance ?? 0,
    });

    if (validationError) {
      setError("root.payment", { message: validationError });
      return;
    }

    try {
      await onSubmit({
        amount,
        sourceAccountId: values.sourceAccountId,
        date: values.date,
        description: values.description,
        statementId: pendingStatement.id,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Record payment error:", error);
      if (error instanceof TypeError) {
        setError("root.server", {
          message:
            "No se pudo registrar el pago. Revisa tu conexión.",
        });
      } else {
        setError("root.server", {
          message: "No se pudo registrar el pago. Intenta de nuevo.",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-[calc(100%-2rem)]">
        <DialogHeader>
          <DialogTitle>Pagar {creditCardAccount.name}</DialogTitle>
        </DialogHeader>

        <div className="rounded-lg bg-muted/50 border border-border/60 p-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Saldo extracto</span>
            <span className="font-medium">
              {formatCOP(statementSummary.remainingAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pago mínimo</span>
            <span className="font-medium text-warning">
              {formatCOP(pendingStatement.minimum_payment)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vence</span>
            <span className="font-medium">{pendingStatement.due_date}</span>
          </div>
          <p className="pt-1 text-xs text-muted-foreground">
            Saldo pendiente después de pagar: {formatCOP(remainingAfterPayment)}
            .
          </p>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pay-amount">Monto a pagar (COP)</Label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <Input
                  id="pay-amount"
                  type="text"
                  inputMode="numeric"
                  value={field.value}
                  onChange={(e) =>
                    field.onChange(formatIntegerInput(e.target.value))
                  }
                  onBlur={() => clearErrors()}
                  placeholder="50.000"
                  required
                  className="text-2xl font-bold h-14"
                  aria-invalid={Boolean(errors.root?.payment)}
                  aria-describedby={
                    errors.root?.payment ? "pay-error" : undefined
                  }
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-source">Cuenta de origen</Label>
            <Controller
              name="sourceAccountId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    clearErrors();
                    field.onChange(v ?? "");
                  }}
                >
                  <SelectTrigger id="pay-source" className="h-11">
                    <SelectValue placeholder="Selecciona cuenta">
                      {() =>
                        selectedSource
                          ? `${selectedSource.name} · ${formatCOP(selectedSource.balance)}`
                          : "Selecciona cuenta"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {sourceAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id} label={a.name}>
                        {a.name} · {formatCOP(a.balance)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-date">Fecha del pago</Label>
            <Input
              id="pay-date"
              type="date"
              className="h-11"
              {...register("date")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-description">Descripción</Label>
            <Input
              id="pay-description"
              className="h-11"
              {...register("description")}
            />
          </div>

          {errors.root?.payment?.message && (
            <p
              id="pay-error"
              className="text-sm text-destructive"
              aria-live="polite"
            >
              {errors.root.payment.message}
            </p>
          )}
          {errors.root?.server?.message && (
            <p className="text-sm text-destructive" aria-live="polite">
              {errors.root.server.message}
            </p>
          )}

          <Button
            type="submit"
            className="h-11 w-full"
            disabled={isSubmitting || !watchedSourceId}
          >
            {isSubmitting ? "Procesando..." : "Confirmar pago"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
