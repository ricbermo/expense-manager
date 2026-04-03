"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { AccountCard } from "@/components/accounts/account-card";
import { AccountForm } from "@/components/accounts/account-form";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { normalizeStoredBalance } from "@/lib/utils/account-balance";
import { formatCOP } from "@/lib/utils/currency";
import type { Account } from "@/lib/types/database";

export default function AccountsPage() {
  const { accounts, loading, createAccount, updateAccount, deleteAccount } =
    useAccounts();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | undefined>();

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
    if (confirm("Eliminar esta cuenta?")) {
      await deleteAccount(id);
    }
  };

  return (
    <div>
      <PageHeader
        title="Cuentas"
        description="Tus cuentas y tarjetas"
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

      <div className="px-4 space-y-4">
        <div className="rounded-xl bg-card p-4 border border-border">
          <p className="text-xs text-muted-foreground">Balance total</p>
          <p
            className={`text-2xl font-bold ${totalBalance >= 0 ? "text-emerald-500" : "text-rose-500"}`}
          >
            {formatCOP(totalBalance)}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-card animate-pulse border border-border"
              />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="rounded-xl bg-card p-6 border border-border text-center text-muted-foreground">
            <p>No hay cuentas registradas</p>
            <p className="text-xs mt-1">Agrega tu primera cuenta</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={handleEdit}
                onDelete={handleDelete}
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
    </div>
  );
}
