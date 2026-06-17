"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export function useMealReservation(userId: string) {
  const [reservedMenuIds, setReservedMenuIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchReservations = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("meal_reservations")
      .select("menu_id")
      .eq("user_id", userId)
      .eq("cancelled", false);
    setReservedMenuIds(new Set((data ?? []).map((r) => r.menu_id)));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const reserve = useCallback(
    async (menuId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("meal_reservations")
        .insert({ user_id: userId, menu_id: menuId });
      if (!error) {
        setReservedMenuIds((prev) => new Set([...prev, menuId]));
      }
      return { error };
    },
    [userId]
  );

  const cancel = useCallback(
    async (menuId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("meal_reservations")
        .update({ cancelled: true })
        .eq("user_id", userId)
        .eq("menu_id", menuId);
      if (!error) {
        setReservedMenuIds((prev) => {
          const next = new Set(prev);
          next.delete(menuId);
          return next;
        });
      }
      return { error };
    },
    [userId]
  );

  return { reservedMenuIds, loading, reserve, cancel };
}
