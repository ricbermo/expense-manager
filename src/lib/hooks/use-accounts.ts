"use client";

import { useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeyPrefix, swrKeys } from "@/lib/swr/keys";
import type { Account } from "@/lib/types/database";
import { normalizeStoredBalance } from "@/lib/utils/account-balance";

export function useAccounts() {
  const { mutate: globalMutate } = useSWRConfig();

  const fetchAccounts = useCallback(async (): Promise<Account[]> => {
    const supabase = createClient();
    const { data } = await supabase
      .from("accounts")
      .select("*")
      .is("archived_at", null)
      .order("created_at", { ascending: false });
    return (data ?? []) as Account[];
  }, []);

  const {
    data: accounts = [],
    isLoading: loading,
    mutate,
  } = useSWR(swrKeys.accounts, fetchAccounts);

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const revalidateDashboard = useCallback(async () => {
    await globalMutate(
      (key) => Array.isArray(key) && key[0] === swrKeyPrefix.dashboard,
      undefined,
      { revalidate: true },
    );
  }, [globalMutate]);

  const createAccount = async (account: Omit<Account, "id" | "created_at" | "archived_at">) => {
    const supabase = createClient();
    const payload = {
      ...account,
      balance: normalizeStoredBalance(account.type, account.balance),
    };
    const { data, error } = await supabase
      .from("accounts")
      .insert(payload as never)
      .select()
      .single();
    if (error) throw error;
    await mutate();
    await revalidateDashboard();
    return data;
  };

  const updateAccount = async (
    id: string,
    updates: Partial<Omit<Account, "id" | "created_at" | "archived_at">>,
  ) => {
    const supabase = createClient();
    const accountType = updates.type ?? accounts.find((a) => a.id === id)?.type;
    const normalizedUpdates = {
      ...updates,
      balance:
        updates.balance !== undefined && accountType
          ? normalizeStoredBalance(accountType, updates.balance)
          : updates.balance,
    };
    const { data, error } = await supabase
      .from("accounts")
      .update(normalizedUpdates as never)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    await mutate();
    await revalidateDashboard();
    return data;
  };

  const deleteAccount = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("accounts")
      .update({ archived_at: new Date().toISOString() } as never)
      .eq("id", id);
    if (error) throw error;
    await mutate();
    await revalidateDashboard();
  };

  const restoreAccount = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("accounts")
      .update({ archived_at: null } as never)
      .eq("id", id);
    if (error) throw error;
    await mutate();
    await revalidateDashboard();
  };

  return {
    accounts,
    loading,
    createAccount,
    updateAccount,
    deleteAccount,
    restoreAccount,
    refetch,
  };
}
