"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { Category, CategoryType } from "@/lib/types/database";

export function useCategories(type?: CategoryType) {
  const fetchCategories = useCallback(async (): Promise<Category[]> => {
    const supabase = createClient();
    let query = supabase.from("categories").select("*").order("name");
    if (type) {
      query = query.eq("type", type);
    }

    const { data } = await query;
    return (data ?? []) as Category[];
  }, [type]);

  const {
    data: categories = [],
    isLoading: loading,
    mutate,
  } = useSWR(swrKeys.categories(type), fetchCategories);

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return { categories, loading, refetch };
}
