"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export type MealMenu = {
  id: string;
  menu_date: string;
  meal_type: "조식" | "중식" | "석식";
  items: string[];
  published: boolean;
  published_at: string | null;
  created_at: string;
};

export function useMealMenus(targetDate?: string) {
  const [menus, setMenus] = useState<MealMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let query = supabase
      .from("meal_menus")
      .select("*")
      .eq("published", true)
      .order("menu_date", { ascending: true })
      .order("meal_type", { ascending: true });

    if (targetDate) {
      query = query.gte("menu_date", targetDate);
    }

    query.then(({ data, error }) => {
      if (error) setError(error.message);
      else setMenus(data ?? []);
      setLoading(false);
    });
  }, [targetDate]);

  return { menus, loading, error };
}
