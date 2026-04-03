"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Transaction, Category, Account } from "@/lib/types/database";

export interface TransactionWithRelations extends Transaction {
  categories: Category | null;
  accounts: Account | null;
}

export function useTransactions(month?: string) {
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    const supabase = createClient();
    let query = supabase
      .from("transactions")
      .select("*, categories(*), accounts(*)")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (month) {
      const start = `${month}-01`;
      const [y, m] = month.split("-").map(Number);
      const end = `${y}-${String(m + 1).padStart(2, "0")}-01`;
      query = query.gte("date", start).lt("date", end);
    }

    const { data } = await query;
    setTransactions((data as TransactionWithRelations[]) ?? []);
    setLoading(false);
  }, [month]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const createTransaction = async (
    transaction: Omit<Transaction, "id" | "created_at">
  ) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("transactions")
      .insert(transaction as never);
    if (error) throw error;
    await fetchTransactions();
  };

  const deleteTransaction = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);
    if (error) throw error;
    await fetchTransactions();
  };

  return {
    transactions,
    loading,
    createTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  };
}
