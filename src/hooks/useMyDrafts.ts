import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase";

export type DraftSummary = {
  id: string;
  title: string;
  doc_type: string;
  status: string;
  created_at: string;
};

export function useMyDrafts() {
  const { profile } = useAuth();
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: dbError } = await supabase
      .from("drafts")
      .select("id, title, doc_type, status, created_at")
      .eq("drafter_id", profile.id)
      .order("created_at", { ascending: false });

    setLoading(false);
    if (dbError) { setError(dbError.message); return; }
    setDrafts(data ?? []);
  }, [profile?.id]);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  return { drafts, loading, error, refetch: fetchDrafts };
}
