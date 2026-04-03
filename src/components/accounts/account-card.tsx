"use client";

import { Wallet, Banknote, CreditCard, Landmark, Trash2, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCOP } from "@/lib/utils/currency";
import type { Account } from "@/lib/types/database";
import { Progress } from "@/components/ui/progress";
import { normalizeStoredBalance } from "@/lib/utils/account-balance";

const accountIcons = {
  savings: Wallet,
  cash: Banknote,
  credit_card: CreditCard,
  loan: Landmark,
} as const;

const accountLabels = {
  savings: "Ahorros",
  cash: "Efectivo",
  credit_card: "Tarjeta de Credito",
  loan: "Prestamo",
} as const;

const accentByType = {
  savings: "bg-emerald-100 text-emerald-700",
  cash: "bg-teal-100 text-teal-700",
  credit_card: "bg-amber-100 text-amber-700",
  loan: "bg-blue-100 text-blue-700",
} as const;

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

export function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const Icon = accountIcons[account.type];
  const normalizedBalance = normalizeStoredBalance(account.type, account.balance);
  const utilization =
    account.type === "credit_card" && account.credit_limit
      ? Math.round((Math.abs(normalizedBalance) / account.credit_limit) * 100)
      : null;

  return (
    <Card className="section-card gap-4 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${accentByType[account.type]}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">{account.name}</p>
            <Badge variant="secondary" className="mt-1 text-xs">
              {accountLabels[account.type]}
            </Badge>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 transition-colors duration-200"
            onClick={() => onEdit(account)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground transition-colors duration-200 hover:text-destructive"
            onClick={() => onDelete(account.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <p
          className={`text-2xl font-semibold tabular-nums ${
            normalizedBalance >= 0 ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {formatCOP(normalizedBalance)}
        </p>
        {account.type === "credit_card" && account.credit_limit && (
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Usado</span>
              <span>
                {formatCOP(Math.abs(normalizedBalance))} /{" "}
                {formatCOP(account.credit_limit)}
              </span>
            </div>
            <Progress value={utilization ?? 0} className="h-2" />
          </div>
        )}
        {account.interest_rate && (
          <p className="text-xs text-muted-foreground mt-1">
            Tasa: {account.interest_rate}%
          </p>
        )}
        {account.due_day && (
          <p className="text-xs text-muted-foreground">
            Dia de pago: {account.due_day}
          </p>
        )}
      </div>
    </Card>
  );
}
