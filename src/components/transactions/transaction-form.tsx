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
import { useCategories } from "@/lib/hooks/use-categories";
import type { Account, Transaction, TransactionType } from "@/lib/types/database";

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
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [saving, setSaving] = useState(false);

  const categoryType = type === "income" ? "income" : "expense";
  const { categories } = useCategories(
    type === "transfer" || type === "payment" ? undefined : categoryType
  );

  const filteredCategories = categories.filter(
    (c) => c.type === categoryType
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        type,
        amount: parseInt(amount) || 0,
        description: description || null,
        date,
        category_id:
          type === "transfer" || type === "payment" ? null : categoryId || null,
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
      setToAccountId("");
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
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50000"
              required
              className="text-2xl font-bold h-14"
            />
          </div>

          {type !== "transfer" && type !== "payment" && (
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecciona categoria" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((c) => (
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
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(type === "transfer" || type === "payment") && (
            <div className="space-y-2">
              <Label htmlFor="toAccount">Cuenta destino</Label>
              <Select value={toAccountId} onValueChange={(v) => setToAccountId(v ?? "")}>
                <SelectTrigger id="toAccount">
                  <SelectValue placeholder="Selecciona cuenta destino" />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
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
            disabled={saving || !amount || !accountId}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
