import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase";
import { readCache, writeCache } from "@/lib/local-cache";

export type ApprovalStep = {
  order_index: number;
  action: string;
  approver_name: string;
  approver_position: string;
};

export type DraftSummary = {
  id: string;
  title: string;
  doc_type: string;
  status: string;
  created_at: string;
  steps: ApprovalStep[];
};

const draftsCacheKey = (userId: string) => `somang-drafts-${userId}`;

export function useMyDrafts() {
  const { profile } = useAuth();
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 캐시된 결과를 즉시 표시하고 백그라운드에서 갱신 (첫 조회 "불러오는중" 제거)
  useEffect(() => {
    if (!profile) return;
    const cached = readCache<DraftSummary[]>(draftsCacheKey(profile.id));
    if (cached) {
      setDrafts(cached);
      setLoading(false);
    }
  }, [profile?.id]);

  const fetchDrafts = useCallback(async () => {
    if (!profile) return;
    // 캐시가 이미 표시 중이면 스피너로 되돌리지 않는다
    if (readCache<DraftSummary[]>(draftsCacheKey(profile.id)) === null) {
      setLoading(true);
    }
    setError(null);
    const supabase = createClient();
    const { data, error: dbError } = await supabase
      .from("drafts")
      .select(`
        id, title, doc_type, status, created_at,
        draft_approval_steps (
          order_index, action,
          profiles!approver_id ( full_name, position )
        )
      `)
      .eq("drafter_id", profile.id)
      .in("status", ["in_progress", "pending", "rejected", "approved"])
      .order("created_at", { ascending: false });

    setLoading(false);
    if (dbError) { setError(dbError.message); return; }

    const mapped = (data ?? []).map((d: any) => ({
      id: d.id,
      title: d.title,
      doc_type: d.doc_type,
      status: d.status,
      created_at: d.created_at,
      steps: (d.draft_approval_steps ?? [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((s: any) => ({
          order_index: s.order_index,
          action: s.action,
          approver_name: s.profiles?.full_name ?? "",
          approver_position: s.profiles?.position ?? "",
        })),
    }));
    setDrafts(mapped);
    writeCache(draftsCacheKey(profile.id), mapped);
  }, [profile?.id]);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  return { drafts, loading, error, refetch: fetchDrafts };
}
