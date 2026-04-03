"use client";

import { useState } from "react";
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
  const [name, setName] = useState(initialData?.name ?? "");
  const [type, setType] = useState<AccountType>(
    initialData?.type ?? "savings"
  );
  const [balance, setBalance] = useState(
    initialData
      ? String(toBalanceFieldValue(initialData.type, initialData.balance))
      : "0"
  );
  const [creditLimit, setCreditLimit] = useState(
    initialData?.credit_limit ? String(initialData.credit_limit) : ""
  );
  const [interestRate, setInterestRate] = useState(
    initialData?.interest_rate ? String(initialData.interest_rate) : ""
  );
  const [dueDay, setDueDay] = useState(
    initialData?.due_day ? String(initialData.due_day) : ""
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        name,
        type,
        balance: normalizeStoredBalance(type, parseInt(balance) || 0),
        credit_limit: type === "credit_card" ? parseInt(creditLimit) || null : null,
        interest_rate:
          type !== "savings" ? parseFloat(interestRate) || null : null,
        due_day:
          type !== "savings" ? parseInt(dueDay) || null : null,
      });
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
              onValueChange={(v) => setType(v as AccountType)}
            >
              <SelectTrigger id="type">
                <SelectValue />
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
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0"
            />
          </div>

          {type === "credit_card" && (
            <div className="space-y-2">
              <Label htmlFor="creditLimit">Cupo total</Label>
              <Input
                id="creditLimit"
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="5000000"
              />
            </div>
          )}

          {type !== "savings" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="interestRate">Tasa de interes (%)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="28.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDay">Dia de pago</Label>
                <Input
                  id="dueDay"
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  placeholder="15"
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={saving || !name}>
            {saving ? "Guardando..." : initialData ? "Actualizar" : "Crear"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
