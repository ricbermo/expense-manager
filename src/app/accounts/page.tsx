"use client";

import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  const month = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);
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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        if (!formOpen) {
          e.preventDefault();
          setEditing(undefined);
          setFormOpen(true);
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [formOpen]);

  const sourceAccounts = useMemo(
    () => accounts.filter((a) => a.type === "savings" || a.type === "cash"),
    [accounts],
  );

  const accountTotals = useMemo(() => getAccountBalances(accounts), [accounts]);
  const accountCounts = useMemo(
    () => ({
      liquid: accounts.filter((a) => a.type === "savings" || a.type === "cash")
        .length,
      credit: accounts.filter((a) => a.type === "credit_card").length,
      total: accounts.length,
    }),
    [accounts],
  );
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

  const handleSubmit = async (data: Omit<Account, "id" | "created_at" | "archived_at">) => {
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
    } catch (error) {
      console.error("Delete account error:", error);
      if (error instanceof TypeError) {
        toast.error("No se pudo eliminar la cuenta. Revisa tu conexión.");
      } else {
        toast.error("No se pudo eliminar la cuenta.");
      }
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
      console.error("Create statement error:", error);
      if (error instanceof TypeError) {
        toast.error("No se pudo guardar el extracto. Revisa tu conexión.");
      } else {
        toast.error("No se pudo guardar el extracto.");
      }
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
      console.error("Record payment error:", error);
      if (error instanceof TypeError) {
        toast.error("No se pudo registrar el pago. Revisa tu conexión.");
      } else {
        toast.error("No se pudo registrar el pago.");
      }
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
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nueva
          </Button>
        }
      />

      <div className="app-shell page-stack">
        {nextStatement && nextPaymentAccount ? (
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
              <p className="text-xl font-semibold tabular-nums text-warning">
                {formatCOP(
                  getStatementPaymentSummary(nextStatement).remainingAmount,
                )}
              </p>
            </div>
          </section>
        ) : (
          <div className="min-h-[8rem]" aria-hidden="true" />
        )}

        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="section-card p-4">
            <dt className="text-xs text-muted-foreground">Disponible</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">
              {formatCOP(accountTotals.liquidFunds)}
            </dd>
            {accountCounts.liquid > 0 && (
              <dd className="mt-1 text-[11px] text-muted-foreground/70">
                {accountCounts.liquid}{" "}
                {accountCounts.liquid === 1 ? "cuenta" : "cuentas"}
              </dd>
            )}
          </div>
          <div className="section-card p-4">
            <dt className="text-xs text-muted-foreground">Deuda de tarjetas</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-negative">
              {formatCOP(accountTotals.cardDebt)}
            </dd>
            {accountCounts.credit > 0 && (
              <dd className="mt-1 text-[11px] text-muted-foreground/70">
                {accountCounts.credit}{" "}
                {accountCounts.credit === 1 ? "tarjeta" : "tarjetas"}
              </dd>
            )}
          </div>
          <div className="section-card p-4">
            <dt className="text-xs text-muted-foreground">
              Posición neta
              <span
                className="ml-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-muted text-[11px] font-semibold leading-none text-muted-foreground align-middle cursor-help"
                aria-describedby="net-position-desc"
                tabIndex={0}
              >
                ?
              </span>
              <span id="net-position-desc" className="sr-only">
                Tus ahorros y efectivo, menos tus deudas.
              </span>
            </dt>
            <dd
              className={`mt-1 text-lg font-semibold tabular-nums ${accountTotals.netPosition >= 0 ? "text-positive" : "text-negative"}`}
            >
              {formatCOP(accountTotals.netPosition)}
            </dd>
            {accountCounts.total > 0 && (
              <dd className="mt-1 text-[11px] text-muted-foreground/70">
                {accountCounts.total}{" "}
                {accountCounts.total === 1 ? "cuenta" : "cuentas"}
              </dd>
            )}
          </div>
        </dl>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="section-card animate-pulse p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 rounded bg-muted" />
                    <div className="h-3 w-20 rounded bg-muted" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-16 rounded bg-muted" />
                  <div className="h-7 w-28 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="empty-state text-muted-foreground" role="status">
            <p className="font-medium text-foreground">
              Sin cuentas registradas
            </p>
            <p className="text-xs mt-1">
              Agrega tus cuentas de ahorro, tarjetas o efectivo para llevar el
              control de tu saldo
            </p>
            <Button className="mt-4 h-8" onClick={() => setFormOpen(true)}>
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
