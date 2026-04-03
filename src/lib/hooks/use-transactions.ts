"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Transaction, Category, Account } from "@/lib/types/database";
import { getTransactionsErrorMessage } from "@/lib/utils/transactions-error";

export interface TransactionWithRelations extends Transaction {
  categories: Category | null;
  accounts: Account | null;
}

export function useTransactions(month?: string) {
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("transactions")
      .select(
        "*, categories(*), accounts:accounts!transactions_account_id_fkey(*)"
      )
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (month) {
      const start = `${month}-01`;
      const [y, m] = month.split("-").map(Number);
      const end = `${y}-${String(m + 1).padStart(2, "0")}-01`;
      query = query.gte("date", start).lt("date", end);
    }

    const { data, error: queryError } = await query;
    if (queryError) {
      setError(getTransactionsErrorMessage(queryError));
      setLoading(false);
      return;
    }

    setTransactions((data as TransactionWithRelations[]) ?? []);
    setError(null);
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
    if (error) {
      setError(getTransactionsErrorMessage(error));
      throw error;
    }
    await fetchTransactions();
  };

  const deleteTransaction = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);
    if (error) {
      setError(getTransactionsErrorMessage(error));
      throw error;
    }
    await fetchTransactions();
  };

  return {
    transactions,
    loading,
    error,
    createTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  };
}
