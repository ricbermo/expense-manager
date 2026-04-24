"use client";

import { useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeyPrefix, swrKeys } from "@/lib/swr/keys";
import type { CreditCardStatement } from "@/lib/types/database";

export type StatementWithAccount = CreditCardStatement & {
  accounts: { name: string } | null;
};

export function useCreditCardStatements() {
  const { mutate: globalMutate } = useSWRConfig();

  const fetchStatements = useCallback(async (): Promise<StatementWithAccount[]> => {
    const supabase = createClient();
    const { data } = await supabase
      .from("credit_card_statements")
      .select("*, accounts(name)")
      .order("due_date", { ascending: true });
    return (data ?? []) as StatementWithAccount[];
  }, []);

  const {
    data: statements = [],
    isLoading: loading,
    mutate,
  } = useSWR(swrKeys.creditCardStatements, fetchStatements);

  const revalidateRelated = useCallback(async () => {
    await Promise.all([
      mutate(),
      globalMutate(
        (key) => Array.isArray(key) && key[0] === swrKeyPrefix.dashboard,
        undefined,
        { revalidate: true }
      ),
    ]);
  }, [mutate, globalMutate]);

  const pendingByAccountId = statements
    .filter((s) => s.paid_at === null)
    .reduce<Record<string, StatementWithAccount>>((acc, s) => {
      // Keep the most recent unpaid statement per account
      if (!acc[s.account_id] || s.due_date > acc[s.account_id].due_date) {
        acc[s.account_id] = s;
      }
      return acc;
    }, {});

  const createStatement = async (
    data: Omit<CreditCardStatement, "id" | "created_at" | "paid_at" | "payment_transaction_id">
  ) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("credit_card_statements")
      .insert(data as never);
    if (error) throw error;
    await revalidateRelated();
  };

  const markAsPaid = async (statementId: string, paymentTransactionId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("credit_card_statements")
      .update({ paid_at: new Date().toISOString(), payment_transaction_id: paymentTransactionId } as never)
      .eq("id", statementId);
    if (error) throw error;
    await revalidateRelated();
  };

  return { statements, loading, pendingByAccountId, createStatement, markAsPaid };
}
