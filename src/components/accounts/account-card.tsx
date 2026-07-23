"use client";

import {
  Banknote,
  CreditCard,
  FileText,
  Landmark,
  MoreHorizontal,
  Pencil,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineConfirm } from "@/components/ui/inline-confirm";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AccountActivity } from "@/lib/hooks/use-account-activity";
import type { StatementWithAccount } from "@/lib/hooks/use-credit-card-statements";
import type { Account } from "@/lib/types/database";
import { normalizeStoredBalance } from "@/lib/utils/account-balance";
import { getStatementPaymentSummary } from "@/lib/utils/credit-card-statements";
import { formatCOP } from "@/lib/utils/currency";

const accountIcons = {
  savings: Wallet,
  cash: Banknote,
  credit_card: CreditCard,
  loan: Landmark,
} as const;

const accountLabels = {
  savings: "Ahorros",
  cash: "Efectivo",
  credit_card: "Tarjeta de crédito",
  loan: "Préstamo",
} as const;

const typeBgVar = {
  savings: "var(--acc-savings-bg)",
  cash: "var(--acc-cash-bg)",
  credit_card: "var(--acc-credit-bg)",
  loan: "var(--acc-loan-bg)",
} as const;

const typeTextVar = {
  savings: "var(--acc-savings-text)",
  cash: "var(--acc-cash-text)",
  credit_card: "var(--acc-credit-text)",
  loan: "var(--acc-loan-text)",
} as const;

interface AccountCardProps {
  account: Account;
  activity?: AccountActivity;
  openStatements: StatementWithAccount[];
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
  onRegisterStatement?: (account: Account) => void;
  onPayCC?: (account: Account) => void;
}

export function AccountCard({
  account,
  activity,
  openStatements,
  onEdit,
  onDelete,
  onRegisterStatement,
  onPayCC,
}: AccountCardProps) {
  const Icon = accountIcons[account.type];
  const normalizedBalance = normalizeStoredBalance(
    account.type,
    account.balance,
  );
  const displayedBalance =
    account.type === "credit_card" || account.type === "loan"
      ? Math.abs(normalizedBalance)
      : normalizedBalance;
  const [managementOpen, setManagementOpen] = useState(false);
  const nextStatement = openStatements[0];
  const totalOutstanding = openStatements.reduce(
    (sum, statement) =>
      sum + getStatementPaymentSummary(statement).remainingAmount,
    0,
  );

  return (
    <Card className="section-card gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{
              backgroundColor: typeBgVar[account.type],
              color: typeTextVar[account.type],
            }}
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
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onEdit(account)}
            aria-label={`Editar cuenta ${account.name}`}
          >
            <Pencil className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setManagementOpen(true)}
            aria-label={`Administrar cuenta ${account.name}`}
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground">
          {account.type === "credit_card"
            ? "Deuda actual"
            : account.type === "loan"
              ? "Saldo pendiente"
              : "Saldo disponible"}
        </p>
        <p
          className={`mt-1 text-2xl font-semibold tabular-nums ${
            displayedBalance >= 0 ? "text-positive" : "text-negative"
          }`}
        >
          {formatCOP(displayedBalance)}
        </p>
        {account.interest_rate && (
          <p className="mt-1 text-xs text-muted-foreground">
            Tasa: {account.interest_rate}%
          </p>
        )}
      </div>

      {account.type === "credit_card" && nextStatement ? (
        <div
          className="rounded-lg border p-3"
          style={{
            backgroundColor: "var(--alert-warning-bg)",
            borderColor: "var(--alert-warning-border)",
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: "var(--alert-warning-text)" }}
              >
                Próximo extracto
              </p>
              <p
                className="mt-0.5 text-xs"
                style={{ color: "var(--alert-warning-text-secondary)" }}
              >
                Vence {nextStatement.due_date}
              </p>
            </div>
            <p
              className="text-sm font-semibold tabular-nums"
              style={{ color: "var(--alert-warning-text)" }}
            >
              {formatCOP(
                getStatementPaymentSummary(nextStatement).remainingAmount,
              )}
            </p>
          </div>
          {openStatements.length > 1 && (
            <p
              className="mt-2 text-xs"
              style={{ color: "var(--alert-warning-text-secondary)" }}
            >
              {openStatements.length} extractos pendientes ·{" "}
              {formatCOP(totalOutstanding)} en total
            </p>
          )}
          <button
            type="button"
            className="mt-3 text-xs font-medium underline-offset-2 hover:underline"
            style={{ color: "var(--alert-warning-text)" }}
            onClick={() => onPayCC?.(account)}
          >
            Pagar extracto
          </button>
        </div>
      ) : account.type === "credit_card" ? (
        <Button
          className="h-8 w-full"
          onClick={() => onRegisterStatement?.(account)}
        >
          <FileText className="h-4 w-4" />
          Registrar extracto
        </Button>
      ) : null}

      {activity && (activity.income > 0 || activity.expense > 0) && (
        <div className="flex items-center gap-3 border-t border-border/40 pt-2 text-xs text-muted-foreground">
          {activity.income > 0 && (
            <span className="font-medium text-positive">
              +{formatCOP(activity.income)}
            </span>
          )}
          {activity.expense > 0 && (
            <span className="font-medium text-negative">
              −{formatCOP(activity.expense)}
            </span>
          )}
          <span>en el mes seleccionado</span>
        </div>
      )}

      <Sheet open={managementOpen} onOpenChange={setManagementOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Administrar {account.name}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2 px-4 pb-4">
            <Button
              variant="outline"
              className="h-8 w-full"
              onClick={() => {
                setManagementOpen(false);
                onEdit(account);
              }}
            >
              <Pencil className="h-4 w-4" />
              Editar cuenta
            </Button>
            <InlineConfirm
              onConfirm={() => onDelete(account.id)}
              label="Eliminar cuenta"
            />
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
