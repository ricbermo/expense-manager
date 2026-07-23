"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
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
import type { Account, AccountType } from "@/lib/types/database";
import {
  normalizeStoredBalance,
  toBalanceFieldValue,
} from "@/lib/utils/account-balance";
import {
  formatIntegerInput,
  parseDecimalInput,
  parseDueDayInput,
  parseIntegerInput,
  sanitizeDecimalInput,
} from "@/lib/utils/number-input-format";

const accountTypeLabels: Record<AccountType, string> = {
  savings: "Ahorros",
  cash: "Efectivo",
  credit_card: "Tarjeta de crédito",
  loan: "Préstamo",
};

function getAccountFormValues(data?: Account) {
  return {
    name: data?.name ?? "",
    type: data?.type ?? ("savings" as AccountType),
    balance: data
      ? formatIntegerInput(String(toBalanceFieldValue(data.type, data.balance)))
      : "",
    creditLimit: data?.credit_limit
      ? formatIntegerInput(String(data.credit_limit))
      : "",
    interestRate:
      data?.interest_rate === null || data?.interest_rate === undefined
        ? ""
        : String(data.interest_rate),
    dueDay: data?.due_day ? String(data.due_day) : "",
  };
}

interface AccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Account, "id" | "created_at">) => Promise<void>;
  initialData?: Account;
}

interface AccountFormValues {
  name: string;
  type: AccountType;
  balance: string;
  creditLimit: string;
  interestRate: string;
  dueDay: string;
}

export function AccountForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: AccountFormProps) {
  const initialValues = getAccountFormValues(initialData) as AccountFormValues;

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    clearErrors,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<AccountFormValues>({
    defaultValues: initialValues,
  });

  const type = useWatch({ control, name: "type" });
  const name = useWatch({ control, name: "name" });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(getAccountFormValues(initialData) as AccountFormValues);
  }, [open, initialData, reset]);

  const onFormSubmit = async (values: AccountFormValues) => {
    const dueDayValue = Number(values.dueDay);
    if (
      (values.type === "credit_card" || values.type === "loan") &&
      values.dueDay &&
      (!Number.isInteger(dueDayValue) || dueDayValue < 1 || dueDayValue > 31)
    ) {
      setError("dueDay", { message: "Ingresa un día entre 1 y 31." });
      return;
    }

    const parsedBalance = parseIntegerInput(values.balance);
    const parsedCreditLimit =
      values.type === "credit_card"
        ? parseIntegerInput(values.creditLimit) || null
        : null;
    const parsedInterestRate =
      values.type === "credit_card" || values.type === "loan"
        ? parseDecimalInput(values.interestRate) || null
        : null;
    const parsedDueDay =
      values.type === "credit_card" || values.type === "loan"
        ? parseDueDayInput(values.dueDay)
        : null;

    try {
      await onSubmit({
        name: values.name.trim(),
        type: values.type,
        balance: normalizeStoredBalance(values.type, parsedBalance),
        credit_limit: parsedCreditLimit,
        interest_rate: parsedInterestRate,
        due_day: parsedDueDay,
      });
      toast.success(initialData ? "Cuenta actualizada" : "Cuenta creada");
      reset(getAccountFormValues() as AccountFormValues);
      onOpenChange(false);
    } catch {
      toast.error("No se pudo guardar la cuenta");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar cuenta" : "Nueva cuenta"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              autoFocus
              {...register("name", { required: true })}
              placeholder="Ej: Bancolombia Ahorros"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    const nextType = v as AccountType;
                    field.onChange(nextType);

                    if (nextType !== "credit_card") {
                      setValue("creditLimit", "");
                    }

                    if (nextType === "savings" || nextType === "cash") {
                      setValue("interestRate", "");
                      setValue("dueDay", "");
                    }
                  }}
                >
                  <SelectTrigger id="type">
                    <SelectValue>{accountTypeLabels[type]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="savings">Ahorros</SelectItem>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="credit_card">
                      Tarjeta de crédito
                    </SelectItem>
                    <SelectItem value="loan">Préstamo</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">
              {type === "credit_card"
                ? "Deuda actual"
                : type === "loan"
                  ? "Saldo pendiente"
                  : "Saldo"}
            </Label>
            <Input
              id="balance"
              type="text"
              inputMode="numeric"
              {...register("balance")}
              onChange={(e) =>
                setValue("balance", formatIntegerInput(e.target.value))
              }
              placeholder="0"
            />
          </div>

          {type === "credit_card" && (
            <div className="space-y-2">
              <Label htmlFor="creditLimit">Cupo total</Label>
              <Input
                id="creditLimit"
                type="text"
                inputMode="numeric"
                {...register("creditLimit")}
                onChange={(e) =>
                  setValue("creditLimit", formatIntegerInput(e.target.value))
                }
                placeholder="5.000.000"
              />
            </div>
          )}

          {(type === "credit_card" || type === "loan") && (
            <>
              <div className="space-y-2">
                <Label htmlFor="interestRate">Tasa de interés (%)</Label>
                <Input
                  id="interestRate"
                  type="text"
                  inputMode="decimal"
                  {...register("interestRate")}
                  onChange={(e) =>
                    setValue(
                      "interestRate",
                      sanitizeDecimalInput(e.target.value, 2),
                    )
                  }
                  placeholder="28.5"
                />
                <p className="text-xs text-muted-foreground">
                  Porcentaje anual. Ej: 28.5
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDay">Día de pago</Label>
                <Controller
                  name="dueDay"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="dueDay"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value.replace(/\D/g, "").slice(0, 2),
                        )
                      }
                      onBlur={() => clearErrors("dueDay")}
                      placeholder="15"
                      aria-invalid={Boolean(errors.dueDay)}
                      aria-describedby={
                        errors.dueDay ? "due-day-error" : undefined
                      }
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Día del mes en que vence el pago. Ej: 15
                </p>
                {errors.dueDay?.message && (
                  <p
                    id="due-day-error"
                    className="text-sm text-destructive"
                    aria-live="polite"
                  >
                    {errors.dueDay.message}
                  </p>
                )}
              </div>
            </>
          )}

          <Button
            type="submit"
            className="h-11 w-full"
            disabled={isSubmitting || !name?.trim()}
          >
            {isSubmitting
              ? "Guardando..."
              : initialData
                ? "Actualizar"
                : "Crear"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
