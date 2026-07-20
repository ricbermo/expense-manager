"use client";

import { useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeyPrefix, swrKeys } from "@/lib/swr/keys";
import type { Transaction, Category, Account, TransactionStatus } from "@/lib/types/database";
import { getTransactionsErrorMessage } from "@/lib/utils/transactions-error";

export interface TransactionWithRelations extends Transaction {
  categories: Category | null;
  budgets: { name: string } | null;
  accounts: Account | null;
}

export function useTransactions(month?: string) {
  const { mutate: globalMutate } = useSWRConfig();

  const fetchTransactions = useCallback(async (): Promise<TransactionWithRelations[]> => {
    const supabase = createClient();
    let query = supabase
      .from("transactions")
      .select(
        "*, categories(*), budgets(name), accounts:accounts!transactions_account_id_fkey(*)"
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
      throw queryError;
    }

    return (data as TransactionWithRelations[]) ?? [];
  }, [month]);

  const {
    data: transactions = [],
    isLoading: loading,
    error,
    mutate,
  } = useSWR(swrKeys.transactions(month), fetchTransactions);

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const revalidateRelatedData = useCallback(async () => {
    await Promise.all([
      mutate(),
      globalMutate(
        (key) => Array.isArray(key) && key[0] === swrKeyPrefix.dashboard,
        undefined,
        { revalidate: true }
      ),
      globalMutate(
        (key) => Array.isArray(key) && key[0] === swrKeyPrefix.budgets,
        undefined,
        { revalidate: true }
      ),
      globalMutate(
        (key) => Array.isArray(key) && key[0] === swrKeys.accounts[0],
        undefined,
        { revalidate: true }
      ),
    ]);
  }, [globalMutate, mutate]);

  const createTransaction = async (
    transaction: Omit<Transaction, "id" | "created_at" | "status"> & { status?: TransactionStatus }
  ) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("transactions")
      .insert(transaction as never);
    if (error) {
      throw error;
    }
    await revalidateRelatedData();
  };

  const createSharedExpense = async (
    expense: Omit<Transaction, "id" | "created_at" | "status"> & { status?: TransactionStatus },
    splitBetween: number
  ) => {
    const supabase = createClient();
    const reimbursementAmount =
      expense.amount - Math.floor(expense.amount / splitBetween);

    // Look up Reembolso category
    const { data: reembolsoCats } = await supabase
      .from("categories")
      .select("id")
      .eq("name", "Reembolso")
      .eq("type", "income")
      .limit(1);
    const reembolsoCategoryId = (reembolsoCats as { id: string }[] | null)?.[0]?.id ?? null;

    const reimbursement: Omit<Transaction, "id" | "created_at" | "status"> & { status?: TransactionStatus } = {
      type: "income",
      amount: reimbursementAmount,
      description: `Reembolso: ${expense.description || "gasto compartido"}`,
      date: expense.date,
      category_id: reembolsoCategoryId,
      budget_id: null,
      related_expense_id: null,
      account_id: expense.account_id,
      to_account_id: null,
      tags: [],
      installments: null,
      is_occasional: false,
    };
    const { data: createdExpense, error: expenseError } = await supabase
      .from("transactions")
      .insert(expense as never)
      .select("id")
      .single();
    if (expenseError) {
      throw expenseError;
    }

    const expenseId = (createdExpense as { id: string } | null)?.id;
    if (!expenseId) {
      throw new Error("No se pudo crear el gasto compartido.");
    }

    reimbursement.related_expense_id = expenseId;

    const { error: reimbursementError } = await supabase
      .from("transactions")
      .insert(reimbursement as never);
    if (reimbursementError) {
      throw reimbursementError;
    }
    await revalidateRelatedData();
  };

  const updateTransaction = async (
    id: string,
    updates: Partial<Omit<Transaction, "id" | "created_at">>
  ) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("transactions")
      .update(updates as never)
      .eq("id", id);
    if (error) {
      throw error;
    }
    await revalidateRelatedData();
  };

  const deleteTransaction = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);
    if (error) {
      throw error;
    }
    await revalidateRelatedData();
  };

  const normalizedError = error ? getTransactionsErrorMessage(error) : null;

  return {
    transactions,
    loading,
    error: normalizedError,
    createTransaction,
    createSharedExpense,
    updateTransaction,
    deleteTransaction,
    refetch,
  };
}
