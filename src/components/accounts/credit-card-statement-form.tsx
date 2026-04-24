"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatIntegerInput, parseIntegerInput } from "@/lib/utils/number-input-format";
import type { Account } from "@/lib/types/database";

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
    formState: { isSubmitting },
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
    await onSubmit({
      account_id: account.id,
      statement_date: values.statement_date,
      total_balance: parseIntegerInput(values.total_balance),
      minimum_payment: parseIntegerInput(values.minimum_payment),
      due_date: values.due_date,
    });
    onOpenChange(false);
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
            <Input id="statement_date" type="date" {...register("statement_date")} required />
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
                  placeholder="500.000"
                  required
                  className="text-xl font-bold h-12"
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
                  placeholder="50.000"
                  required
                  className="text-xl font-bold h-12"
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Fecha límite de pago</Label>
            <Input id="due_date" type="date" {...register("due_date")} required />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar extracto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
