"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AccountCard } from "@/components/accounts/account-card";
import { AccountForm } from "@/components/accounts/account-form";
import { CreditCardPaymentForm } from "@/components/accounts/credit-card-payment-form";
import { CreditCardStatementForm } from "@/components/accounts/credit-card-statement-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useAccountActivity } from "@/lib/hooks/use-account-activity";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCreditCardStatements } from "@/lib/hooks/use-credit-card-statements";
import type { Account } from "@/lib/types/database";
import {
  getAccountBalances,
  getStatementPaymentSummary,
  orderAccountsForReconciliation,
} from "@/lib/utils/credit-card-statements";
import { formatCOP } from "@/lib/utils/currency";

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getDueLabel(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(`${date}T00:00:00`);
  const days = Math.round((dueDate.getTime() - today.getTime()) / 86_400_000);

  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence mañana";
  if (days < 0) return `Venció hace ${Math.abs(days)} días`;
  return `Vence en ${days} días`;
}

export default function AccountsPage() {
  const { accounts, loading, createAccount, updateAccount, deleteAccount } =
    useAccounts();
  const [month] = useState(getCurrentMonth);
  const { activity } = useAccountActivity(month);
  const { openStatements, createStatement, recordPayment } =
    useCreditCardStatements();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | undefined>();
  const [statementFormAccount, setStatementFormAccount] = useState<
    Account | undefined
  >();
  const [paymentFormAccount, setPaymentFormAccount] = useState<
    Account | undefined
  >();

  const sourceAccounts = useMemo(
    () => accounts.filter((a) => a.type === "savings" || a.type === "cash"),
    [accounts],
  );

  const accountTotals = useMemo(() => getAccountBalances(accounts), [accounts]);
  const orderedAccounts = useMemo(
    () => orderAccountsForReconciliation(accounts, openStatements),
    [accounts, openStatements],
  );
  const openStatementsByAccountId = useMemo(
    () =>
      openStatements.reduce<Record<string, typeof openStatements>>(
        (grouped, statement) => {
          const statements = grouped[statement.account_id] ?? [];
          statements.push(statement);
          grouped[statement.account_id] = statements;
          return grouped;
        },
        {},
      ),
    [openStatements],
  );
  const nextStatement = openStatements[0] ?? null;
  const nextPaymentAccount = nextStatement
    ? accounts.find((account) => account.id === nextStatement.account_id)
    : undefined;

  const handleSubmit = async (data: Omit<Account, "id" | "created_at">) => {
    if (editing) {
      await updateAccount(editing.id, data);
      setEditing(undefined);
    } else {
      await createAccount(data);
    }
  };

  const handleEdit = (account: Account) => {
    setEditing(account);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAccount(id);
      toast.success("Cuenta eliminada");
    } catch {
      toast.error("No se pudo eliminar la cuenta");
    }
  };

  const handleStatementSubmit = async (data: {
    account_id: string;
    statement_date: string;
    total_balance: number;
    minimum_payment: number;
    due_date: string;
  }) => {
    try {
      await createStatement(data);
      toast.success("Extracto registrado");
    } catch (error) {
      toast.error("No se pudo guardar el extracto");
      throw error;
    }
  };

  const handlePaymentSubmit = async (data: {
    amount: number;
    sourceAccountId: string;
    date: string;
    description: string;
    statementId: string;
  }) => {
    if (!paymentFormAccount) return;
    try {
      await recordPayment({
        statementId: data.statementId,
        sourceAccountId: data.sourceAccountId,
        amount: data.amount,
        date: data.date,
        description: data.description,
      });
      toast.success("Pago registrado");
    } catch (error) {
      toast.error("No se pudo registrar el pago");
      throw error;
    }
  };

  return (
    <div className="pb-6">
      <PageHeader
        title="Cuentas"
        description="Control de ahorros, crédito y préstamos"
        action={
          <Button
            size="sm"
            className="h-11 px-3"
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Nueva
          </Button>
        }
      />

      <div className="app-shell page-stack">
        {nextStatement && nextPaymentAccount && (
          <section
            className="section-card p-4 md:p-5"
            aria-labelledby="next-payment-title"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p id="next-payment-title" className="text-sm font-medium">
                  Próximo pago
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {nextPaymentAccount.name} ·{" "}
                  {getDueLabel(nextStatement.due_date)}
                </p>
              </div>
              <p className="text-xl font-semibold tabular-nums text-amber-700">
                {formatCOP(
                  getStatementPaymentSummary(nextStatement).remainingAmount,
                )}
              </p>
            </div>
            <Button
              className="mt-4 h-11 w-full sm:w-auto"
              onClick={() => setPaymentFormAccount(nextPaymentAccount)}
            >
              Pagar extracto
            </Button>
          </section>
        )}

        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="section-card p-4">
            <dt className="text-xs text-muted-foreground">Disponible</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">
              {formatCOP(accountTotals.liquidFunds)}
            </dd>
          </div>
          <div className="section-card p-4">
            <dt className="text-xs text-muted-foreground">Deuda de tarjetas</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-rose-700">
              {formatCOP(accountTotals.cardDebt)}
            </dd>
          </div>
          <div className="section-card p-4">
            <dt className="text-xs text-muted-foreground">Posición neta</dt>
            <dd
              className={`mt-1 text-lg font-semibold tabular-nums ${accountTotals.netPosition >= 0 ? "text-emerald-700" : "text-rose-700"}`}
            >
              {formatCOP(accountTotals.netPosition)}
            </dd>
          </div>
        </dl>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="section-card h-32 animate-pulse" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="empty-state text-muted-foreground">
            <p className="font-medium text-foreground">
              Sin cuentas registradas
            </p>
            <p className="text-xs mt-1">
              Agrega tus cuentas de ahorro, tarjetas o efectivo para llevar el
              control de tu saldo
            </p>
            <Button className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Agregar primera cuenta
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orderedAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                activity={activity[account.id]}
                openStatements={openStatementsByAccountId[account.id] ?? []}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRegisterStatement={setStatementFormAccount}
                onPayCC={setPaymentFormAccount}
              />
            ))}
          </div>
        )}
      </div>

      <AccountForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(undefined);
        }}
        onSubmit={handleSubmit}
        initialData={editing}
      />

      {statementFormAccount && (
        <CreditCardStatementForm
          open={!!statementFormAccount}
          onOpenChange={(open) => {
            if (!open) setStatementFormAccount(undefined);
          }}
          account={statementFormAccount}
          onSubmit={handleStatementSubmit}
        />
      )}

      {paymentFormAccount &&
        openStatementsByAccountId[paymentFormAccount.id]?.[0] && (
          <CreditCardPaymentForm
            open={!!paymentFormAccount}
            onOpenChange={(open) => {
              if (!open) setPaymentFormAccount(undefined);
            }}
            creditCardAccount={paymentFormAccount}
            pendingStatement={
              openStatementsByAccountId[paymentFormAccount.id][0]
            }
            sourceAccounts={sourceAccounts}
            onSubmit={handlePaymentSubmit}
          />
        )}
    </div>
  );
}
