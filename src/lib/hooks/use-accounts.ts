"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Account } from "@/lib/types/database";
import { normalizeStoredBalance } from "@/lib/utils/account-balance";

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: false });
    setAccounts(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const createAccount = async (
    account: Omit<Account, "id" | "created_at">
  ) => {
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
    setAccounts((prev) => [data, ...prev]);
    return data;
  };

  const updateAccount = async (
    id: string,
    updates: Partial<Omit<Account, "id" | "created_at">>
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
    setAccounts((prev) => prev.map((a) => (a.id === id ? data : a)));
    return data;
  };

  const deleteAccount = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) throw error;
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  return { accounts, loading, createAccount, updateAccount, deleteAccount, refetch: fetchAccounts };
}
