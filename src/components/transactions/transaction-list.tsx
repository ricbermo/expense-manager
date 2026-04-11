"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Pencil,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InlineConfirm } from "@/components/ui/inline-confirm";
import { formatCOP } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import type { TransactionWithRelations } from "@/lib/hooks/use-transactions";
import { buildTransactionMetaLine } from "@/lib/utils/transaction-list-meta";

const typeIcons = {
  expense: ArrowUpRight,
  income: ArrowDownLeft,
  transfer: ArrowLeftRight,
} as const;

const typeColors = {
  expense: "text-rose-600",
  income: "text-emerald-600",
  transfer: "text-blue-700",
} as const;

const typeLabels = {
  expense: "Gasto",
  income: "Ingreso",
  transfer: "Transferencia",
} as const;

interface TransactionListProps {
  transactions: TransactionWithRelations[];
  onEdit: (transaction: TransactionWithRelations) => void;
  onDelete: (id: string) => void;
}

export function TransactionList({
  transactions,
  onEdit,
  onDelete,
}: TransactionListProps) {
  // Group by date
  const grouped = transactions.reduce<
    Record<string, TransactionWithRelations[]>
  >((acc, t) => {
    const key = t.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, items]) => (
        <section key={date} className="space-y-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {formatDate(date)}
          </p>
          <div className="space-y-2">
            {items.map((t) => {
              const Icon = typeIcons[t.type];

              return (
                <div
                  key={t.id}
                  className="section-card flex items-center gap-3 p-3 transition-colors duration-200 hover:border-primary/30"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60"
                    style={{
                      backgroundColor: t.categories?.color
                        ? `${t.categories.color}22`
                        : undefined,
                    }}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{ color: t.categories?.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {t.description || t.categories?.name || t.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {buildTransactionMetaLine({
                        typeLabel: typeLabels[t.type],
                        accountName: t.accounts?.name ?? "Sin cuenta",
                        budgetName: t.budgets?.name ?? null,
                      })}
                    </p>
                    {t.tags && t.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {t.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0 h-4">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex items-center gap-1">
                    <p className={`text-sm font-semibold tabular-nums ${typeColors[t.type]}`}>
                      {t.type === "income" ? "+" : "-"}
                      {formatCOP(t.amount)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 text-muted-foreground transition-colors duration-200 hover:text-primary"
                      onClick={() => onEdit(t)}
                      aria-label={`Editar ${t.description || t.categories?.name || "movimiento"}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <InlineConfirm
                      onConfirm={() => onDelete(t.id)}
                      label="Eliminar"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
