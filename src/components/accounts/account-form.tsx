"use client";

import { useEffect, useState } from "react";
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
  credit_card: "Tarjeta de Credito",
  loan: "Prestamo",
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

export function AccountForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: AccountFormProps) {
  const initialValues = getAccountFormValues(initialData);
  const [name, setName] = useState(initialValues.name);
  const [type, setType] = useState<AccountType>(initialValues.type);
  const [balance, setBalance] = useState(initialValues.balance);
  const [creditLimit, setCreditLimit] = useState(initialValues.creditLimit);
  const [interestRate, setInterestRate] = useState(initialValues.interestRate);
  const [dueDay, setDueDay] = useState(initialValues.dueDay);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const values = getAccountFormValues(initialData);
    setName(values.name);
    setType(values.type);
    setBalance(values.balance);
    setCreditLimit(values.creditLimit);
    setInterestRate(values.interestRate);
    setDueDay(values.dueDay);
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const parsedBalance = parseIntegerInput(balance);
    const parsedCreditLimit =
      type === "credit_card" ? parseIntegerInput(creditLimit) || null : null;
    const parsedInterestRate =
      type !== "savings" ? parseDecimalInput(interestRate) || null : null;
    const parsedDueDay = type !== "savings" ? parseDueDayInput(dueDay) : null;

    try {
      await onSubmit({
        name: name.trim(),
        type,
        balance: normalizeStoredBalance(type, parsedBalance),
        credit_limit: parsedCreditLimit,
        interest_rate: parsedInterestRate,
        due_day: parsedDueDay,
      });

      const values = getAccountFormValues();
      setName(values.name);
      setType(values.type);
      setBalance(values.balance);
      setCreditLimit(values.creditLimit);
      setInterestRate(values.interestRate);
      setDueDay(values.dueDay);
      onOpenChange(false);
    } finally {
      setSaving(false);
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Bancolombia Ahorros"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={type}
              onValueChange={(v) => {
                const nextType = v as AccountType;
                setType(nextType);

                if (nextType !== "credit_card") {
                  setCreditLimit("");
                }

                if (nextType === "savings") {
                  setInterestRate("");
                  setDueDay("");
                }
              }}
            >
              <SelectTrigger id="type">
                <SelectValue>{accountTypeLabels[type]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="savings">Ahorros</SelectItem>
                <SelectItem value="credit_card">Tarjeta de Credito</SelectItem>
                <SelectItem value="loan">Prestamo</SelectItem>
              </SelectContent>
            </Select>
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
              value={balance}
              onChange={(e) => setBalance(formatIntegerInput(e.target.value))}
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
                value={creditLimit}
                onChange={(e) => setCreditLimit(formatIntegerInput(e.target.value))}
                placeholder="5.000.000"
              />
            </div>
          )}

          {type !== "savings" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="interestRate">Tasa de interes (%)</Label>
                <Input
                  id="interestRate"
                  type="text"
                  inputMode="decimal"
                  value={interestRate}
                  onChange={(e) =>
                    setInterestRate(sanitizeDecimalInput(e.target.value, 2))
                  }
                  placeholder="28.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDay">Dia de pago</Label>
                <Input
                  id="dueDay"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={dueDay}
                  onChange={(e) =>
                    setDueDay(e.target.value.replace(/\D/g, "").slice(0, 2))
                  }
                  onBlur={() => {
                    const parsed = parseDueDayInput(dueDay);
                    setDueDay(parsed ? String(parsed) : "");
                  }}
                  placeholder="15"
                />
              </div>
            </>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={saving || !name.trim()}
          >
            {saving ? "Guardando..." : initialData ? "Actualizar" : "Crear"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
