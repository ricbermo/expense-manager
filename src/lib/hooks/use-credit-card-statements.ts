"use client";

import { useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeyPrefix, swrKeys } from "@/lib/swr/keys";
import type { CreditCardStatement } from "@/lib/types/database";
import type { CreditCardStatementPayment } from "@/lib/types/database";
import { getOpenStatements } from "@/lib/utils/credit-card-statements";

export type StatementWithAccount = CreditCardStatement & {
  accounts: { name: string } | null;
  payments: CreditCardStatementPayment[];
};

export function useCreditCardStatements() {
  const { mutate: globalMutate } = useSWRConfig();

  const fetchStatements = useCallback(async (): Promise<StatementWithAccount[]> => {
    const supabase = createClient();
    const { data } = await supabase
      .from("credit_card_statements")
      .select("*, accounts(name), credit_card_statement_payments(*)")
      .order("due_date", { ascending: true });
    return (data ?? []).map((statement) => {
      const record = statement as CreditCardStatement & {
        accounts: { name: string } | null;
        credit_card_statement_payments: CreditCardStatementPayment[] | null;
      };
      const { credit_card_statement_payments, ...statementData } = record;
      return {
        ...statementData,
        payments: credit_card_statement_payments ?? [],
      };
    });
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

  const openStatements = getOpenStatements(statements);

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

  const recordPayment = async ({
    statementId,
    sourceAccountId,
    amount,
    date,
    description,
  }: {
    statementId: string;
    sourceAccountId: string;
    amount: number;
    date: string;
    description: string;
  }) => {
    const supabase = createClient();
    const { error } = await supabase.rpc("record_credit_card_statement_payment", {
      p_statement_id: statementId,
      p_source_account_id: sourceAccountId,
      p_amount: amount,
      p_date: date,
      p_description: description,
    } as never);
    if (error) throw error;
    await revalidateRelated();
  };

  return { statements, openStatements, loading, createStatement, recordPayment };
}
