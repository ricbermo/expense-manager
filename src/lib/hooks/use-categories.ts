"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category, CategoryType } from "@/lib/types/database";

export function useCategories(type?: CategoryType) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let query = supabase.from("categories").select("*").order("name");
    if (type) {
      query = query.eq("type", type);
    }
    query.then(({ data }) => {
      setCategories(data ?? []);
      setLoading(false);
    });
  }, [type]);

  return { categories, loading };
}
