"use client";

import { Wallet, CreditCard, Landmark, Trash2, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCOP } from "@/lib/utils/currency";
import type { Account } from "@/lib/types/database";
import { Progress } from "@/components/ui/progress";
import { normalizeStoredBalance } from "@/lib/utils/account-balance";

const accountIcons = {
  savings: Wallet,
  credit_card: CreditCard,
  loan: Landmark,
} as const;

const accountLabels = {
  savings: "Ahorros",
  credit_card: "Tarjeta de Credito",
  loan: "Prestamo",
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
    <Card className="p-4 gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">{account.name}</p>
            <Badge variant="secondary" className="text-xs">
              {accountLabels[account.type]}
            </Badge>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(account)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => onDelete(account.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <p
          className={`text-2xl font-bold ${
            normalizedBalance >= 0 ? "text-emerald-500" : "text-rose-500"
          }`}
        >
          {formatCOP(normalizedBalance)}
        </p>
        {account.type === "credit_card" && account.credit_limit && (
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Usado</span>
              <span>
                {formatCOP(Math.abs(normalizedBalance))} / {formatCOP(account.credit_limit)}
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
