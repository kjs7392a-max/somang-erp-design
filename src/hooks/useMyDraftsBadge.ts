import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase";

export function useMyDraftsBadge() {
  const { profile } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    const supabase = createClient();
    supabase
      .from("drafts")
      .select("id", { count: "exact", head: true })
      .eq("drafter_id", profile.id)
      .in("status", ["pending", "in_progress"])
      .then(({ count: c }) => {
        setCount(c ?? 0);
      });
  }, [profile?.id]);

  return count;
}
