"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  CreditCard,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCOP } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import type { TransactionWithRelations } from "@/lib/hooks/use-transactions";

const typeIcons = {
  expense: ArrowUpRight,
  income: ArrowDownLeft,
  transfer: ArrowLeftRight,
  payment: CreditCard,
} as const;

const typeColors = {
  expense: "text-rose-500",
  income: "text-emerald-500",
  transfer: "text-blue-400",
  payment: "text-amber-400",
} as const;

interface TransactionListProps {
  transactions: TransactionWithRelations[];
  onDelete: (id: string) => void;
}

export function TransactionList({
  transactions,
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
        <div key={date}>
          <p className="text-xs text-muted-foreground mb-2 px-1">
            {formatDate(date)}
          </p>
          <div className="space-y-1">
            {items.map((t) => {
              const Icon = typeIcons[t.type];
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl bg-card p-3 border border-border"
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: t.categories?.color
                        ? `${t.categories.color}20`
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
                      {t.accounts?.name}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <p className={`text-sm font-semibold ${typeColors[t.type]}`}>
                      {t.type === "income" ? "+" : "-"}
                      {formatCOP(t.amount)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(t.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
