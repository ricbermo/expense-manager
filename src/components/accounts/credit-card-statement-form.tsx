"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatIntegerInput, parseIntegerInput } from "@/lib/utils/number-input-format";
import type { Account } from "@/lib/types/database";
import { validateStatement } from "@/lib/utils/credit-card-statements";

interface StatementFormValues {
  statement_date: string;
  total_balance: string;
  minimum_payment: string;
  due_date: string;
}

interface CreditCardStatementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account;
  onSubmit: (data: {
    account_id: string;
    statement_date: string;
    total_balance: number;
    minimum_payment: number;
    due_date: string;
  }) => Promise<void>;
}

function getTodayLocalDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

export function CreditCardStatementForm({
  open,
  onOpenChange,
  account,
  onSubmit,
}: CreditCardStatementFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { isSubmitting, errors },
  } = useForm<StatementFormValues>({
    defaultValues: {
      statement_date: getTodayLocalDate(),
      total_balance: "",
      minimum_payment: "",
      due_date: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      statement_date: getTodayLocalDate(),
      total_balance: "",
      minimum_payment: "",
      due_date: "",
    });
  }, [open, reset]);

  const onFormSubmit = async (values: StatementFormValues) => {
    const totalBalance = parseIntegerInput(values.total_balance);
    const minimumPayment = parseIntegerInput(values.minimum_payment);
    const validationError = validateStatement({
      totalBalance,
      minimumPayment,
      statementDate: values.statement_date,
      dueDate: values.due_date,
    });

    if (validationError) {
      setError("root.validation", { message: validationError });
      return;
    }

    try {
      await onSubmit({
        account_id: account.id,
        statement_date: values.statement_date,
        total_balance: totalBalance,
        minimum_payment: minimumPayment,
        due_date: values.due_date,
      });
      onOpenChange(false);
    } catch {
      setError("root.server", { message: "No se pudo guardar el extracto. Intenta de nuevo." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-[calc(100%-2rem)]">
        <DialogHeader>
          <DialogTitle>Registrar extracto — {account.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="statement_date">Fecha del extracto</Label>
            <Input id="statement_date" type="date" className="h-11" {...register("statement_date", { onChange: () => clearErrors() })} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_balance">Saldo total del extracto (COP)</Label>
            <Controller
              name="total_balance"
              control={control}
              render={({ field }) => (
                <Input
                  id="total_balance"
                  type="text"
                  inputMode="numeric"
                  value={field.value}
                  onChange={(e) => field.onChange(formatIntegerInput(e.target.value))}
                  onBlur={() => clearErrors()}
                  placeholder="500.000"
                  required
                  className="text-xl font-bold h-12"
                  aria-invalid={Boolean(errors.root?.validation)}
                  aria-describedby={errors.root?.validation ? "statement-error" : undefined}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="minimum_payment">Pago mínimo (COP)</Label>
            <Controller
              name="minimum_payment"
              control={control}
              render={({ field }) => (
                <Input
                  id="minimum_payment"
                  type="text"
                  inputMode="numeric"
                  value={field.value}
                  onChange={(e) => field.onChange(formatIntegerInput(e.target.value))}
                  onBlur={() => clearErrors()}
                  placeholder="50.000"
                  required
                  className="text-xl font-bold h-12"
                  aria-invalid={Boolean(errors.root?.validation)}
                  aria-describedby={errors.root?.validation ? "statement-error" : undefined}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Fecha límite de pago</Label>
            <Input id="due_date" type="date" className="h-11" {...register("due_date", { onChange: () => clearErrors() })} required />
          </div>

          {errors.root?.validation?.message && (
            <p id="statement-error" className="text-sm text-destructive" aria-live="polite">
              {errors.root.validation.message}
            </p>
          )}
          {errors.root?.server?.message && (
            <p className="text-sm text-destructive" aria-live="polite">
              {errors.root.server.message}
            </p>
          )}

          <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar extracto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
