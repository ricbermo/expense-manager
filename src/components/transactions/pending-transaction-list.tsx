"use client";

import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCOP } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import type { TransactionWithRelations } from "@/lib/hooks/use-transactions";

interface PendingTransactionListProps {
  transactions: TransactionWithRelations[];
  onEdit: (transaction: TransactionWithRelations) => void;
}

export function PendingTransactionList({
  transactions,
  onEdit,
}: PendingTransactionListProps) {
  if (transactions.length === 0) return null;

  return (
    <section className="space-y-2">
      <p className="px-1 text-xs font-semibold uppercase tracking-wide text-amber-600">
        Pendientes por confirmar
        <span className="ml-1.5 text-amber-700/70 normal-case font-normal">
          ({transactions.length})
        </span>
      </p>
      <div className="space-y-2">
        {transactions.map((t) => (
          <div
            key={t.id}
            className="section-card flex items-center gap-3 p-3 border-amber-300/60 bg-amber-50/40"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-amber-700 border-amber-400 bg-amber-100/50"
                >
                  Por confirmar
                </Badge>
              </div>
              <p className="text-sm font-medium truncate mt-1">
                {t.description || t.categories?.name || "Movimiento"}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.accounts?.name ?? "Sin cuenta"} · {formatDate(t.date)}
              </p>
            </div>
            <p className="text-sm font-semibold tabular-nums text-rose-600">
              -{formatCOP(t.amount)}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 text-muted-foreground hover:text-primary"
              onClick={() => onEdit(t)}
              aria-label={`Confirmar ${t.description || "movimiento pendiente"}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}