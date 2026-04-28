"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { AccountCard } from "@/components/accounts/account-card";
import { AccountForm } from "@/components/accounts/account-form";
import { CreditCardStatementForm } from "@/components/accounts/credit-card-statement-form";
import { CreditCardPaymentForm } from "@/components/accounts/credit-card-payment-form";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useAccountActivity } from "@/lib/hooks/use-account-activity";
import { useCreditCardStatements } from "@/lib/hooks/use-credit-card-statements";
import { createClient } from "@/lib/supabase/client";
import { normalizeStoredBalance } from "@/lib/utils/account-balance";
import { formatCOP } from "@/lib/utils/currency";
import type { Account } from "@/lib/types/database";

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function AccountsPage() {
  const { accounts, loading, createAccount, updateAccount, deleteAccount } = useAccounts();
  const [month] = useState(getCurrentMonth);
  const { activity } = useAccountActivity(month);
  const { pendingByAccountId, createStatement, markAsPaid } = useCreditCardStatements();
  const { mutate: globalMutate } = useSWRConfig();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | undefined>();
  const [statementFormAccount, setStatementFormAccount] = useState<Account | undefined>();
  const [paymentFormAccount, setPaymentFormAccount] = useState<Account | undefined>();

  const sourceAccounts = useMemo(
    () => accounts.filter((a) => a.type === "savings" || a.type === "cash"),
    [accounts]
  );

  const totalBalance = accounts.reduce(
    (sum, a) => sum + normalizeStoredBalance(a.type, a.balance),
    0
  );

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
    } catch {
      toast.error("No se pudo guardar el extracto");
    }
  };

  const handlePaymentSubmit = async (data: {
    amount: number;
    sourceAccountId: string;
    date: string;
    description: string;
    statementId: string | null;
  }) => {
    if (!paymentFormAccount) return;
    try {
      const supabase = createClient();
      const { data: txnData, error } = await supabase
        .from("transactions")
        .insert({
          type: "transfer",
          amount: data.amount,
          description: data.description || null,
          date: data.date,
          account_id: data.sourceAccountId,
          to_account_id: paymentFormAccount.id,
          category_id: null,
          budget_id: null,
          related_expense_id: null,
          tags: [],
        } as never)
        .select("id")
        .single();
      if (error) throw error;
      const txnId = (txnData as { id: string }).id;
      if (data.statementId) {
        await markAsPaid(data.statementId, txnId);
      }
      await globalMutate(() => true, undefined, { revalidate: true });
      toast.success("Pago registrado correctamente");
    } catch {
      toast.error("No se pudo registrar el pago");
    }
  };

  return (
    <div className="pb-6">
      <PageHeader
        title="Cuentas"
        description="Control de ahorros, credito y prestamos"
        action={
          <Button
            size="sm"
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
        <div className="kpi-card">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Balance total
          </p>
          <p
            className={`mt-1 text-2xl font-semibold ${totalBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}
          >
            {formatCOP(totalBalance)}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="section-card h-32 animate-pulse" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="empty-state text-muted-foreground">
            <p className="font-medium text-foreground">Sin cuentas registradas</p>
            <p className="text-xs mt-1">
              Agrega tus cuentas de ahorro, tarjetas o efectivo para llevar el control de tu balance
            </p>
            <Button className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Agregar primera cuenta
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                activity={activity[account.id]}
                pendingStatement={pendingByAccountId[account.id]}
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
          onOpenChange={(open) => { if (!open) setStatementFormAccount(undefined); }}
          account={statementFormAccount}
          onSubmit={handleStatementSubmit}
        />
      )}

      {paymentFormAccount && (
        <CreditCardPaymentForm
          open={!!paymentFormAccount}
          onOpenChange={(open) => { if (!open) setPaymentFormAccount(undefined); }}
          creditCardAccount={paymentFormAccount}
          pendingStatement={pendingByAccountId[paymentFormAccount.id] ?? null}
          sourceAccounts={sourceAccounts}
          onSubmit={handlePaymentSubmit}
        />
      )}
    </div>
  );
}
