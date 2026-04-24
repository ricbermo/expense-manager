"use client";

import { Wallet, Banknote, CreditCard, Landmark, Pencil, FileText, ArrowUpFromLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InlineConfirm } from "@/components/ui/inline-confirm";
import { formatCOP } from "@/lib/utils/currency";
import type { Account } from "@/lib/types/database";
import type { AccountActivity } from "@/lib/hooks/use-account-activity";
import type { StatementWithAccount } from "@/lib/hooks/use-credit-card-statements";
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
  activity?: AccountActivity;
  pendingStatement?: StatementWithAccount;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
  onRegisterStatement?: (account: Account) => void;
  onPayCC?: (account: Account) => void;
}

export function AccountCard({ account, activity, pendingStatement, onEdit, onDelete, onRegisterStatement, onPayCC }: AccountCardProps) {
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
            className="h-11 w-11 transition-colors duration-200"
            onClick={() => onEdit(account)}
            aria-label={`Editar cuenta ${account.name}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <InlineConfirm
            onConfirm={() => onDelete(account.id)}
            label="Eliminar"
          />
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
        {account.type === "credit_card" && pendingStatement && (
          <div className="mt-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-800">Extracto pendiente</span>
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-0">
                Vence {pendingStatement.due_date}
              </Badge>
            </div>
            <div className="flex justify-between text-xs text-amber-700">
              <span>Pago mínimo</span>
              <span className="font-semibold">{formatCOP(pendingStatement.minimum_payment)}</span>
            </div>
          </div>
        )}
        {account.type === "credit_card" && (
          <div className="mt-2 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-9 text-xs gap-1.5"
              onClick={() => onRegisterStatement?.(account)}
            >
              <FileText className="h-3.5 w-3.5" />
              Registrar extracto
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-9 text-xs gap-1.5"
              onClick={() => onPayCC?.(account)}
            >
              <ArrowUpFromLine className="h-3.5 w-3.5" />
              Pagar TC
            </Button>
          </div>
        )}
        {activity && (activity.income > 0 || activity.expense > 0) && (
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground border-t border-border/40 pt-2">
            {activity.income > 0 && (
              <span className="text-emerald-600 font-medium">+{formatCOP(activity.income)}</span>
            )}
            {activity.expense > 0 && (
              <span className="text-rose-600 font-medium">−{formatCOP(activity.expense)}</span>
            )}
            <span>este mes</span>
          </div>
        )}
      </div>
    </Card>
  );
}
