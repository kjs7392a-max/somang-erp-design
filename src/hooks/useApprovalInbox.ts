import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase";

export type InboxItem = {
  draftId: string;
  stepId: string;
  title: string;
  drafterName: string;
  drafterDept: string;
  createdAt: string;
};

export function useApprovalInbox() {
  const { profile } = useAuth();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInbox = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();

    // Step 1: 내 pending steps
    const { data: mySteps, error: e1 } = await supabase
      .from("draft_approval_steps")
      .select("id, draft_id, order_index")
      .eq("approver_id", profile.id)
      .eq("action", "pending");

    if (e1) { setError(e1.message); setLoading(false); return; }
    if (!mySteps || mySteps.length === 0) { setItems([]); setLoading(false); return; }

    // Step 2: draft_id dedupe
    const uniqueDraftIds = [...new Set(mySteps.map((s) => s.draft_id))];

    // Step 3: 해당 drafts의 모든 pending steps
    const { data: allSteps, error: e2 } = await supabase
      .from("draft_approval_steps")
      .select("draft_id, order_index, approver_id")
      .in("draft_id", uniqueDraftIds)
      .eq("action", "pending");

    if (e2) { setError(e2.message); setLoading(false); return; }

    // Step 4: draft별 min pending order_index 계산, 내 차례인 것만 필터
    const minIdx: Record<string, number> = {};
    for (const s of allSteps ?? []) {
      if (minIdx[s.draft_id] === undefined || s.order_index < minIdx[s.draft_id]) {
        minIdx[s.draft_id] = s.order_index;
      }
    }
    const myTurnSteps = mySteps.filter((s) => s.order_index === minIdx[s.draft_id]);

    if (myTurnSteps.length === 0) { setItems([]); setLoading(false); return; }

    // Step 5: draft 헤더 + 기안자 정보 조회
    const myTurnDraftIds = myTurnSteps.map((s) => s.draft_id);
    const { data: drafts, error: e3 } = await supabase
      .from("drafts")
      .select("id, title, created_at, profiles!drafter_id(full_name, department)")
      .in("id", myTurnDraftIds);

    if (e3) { setError(e3.message); setLoading(false); return; }

    const result: InboxItem[] = myTurnSteps.map((step) => {
      const draft = (drafts ?? []).find((d) => d.id === step.draft_id);
      const drafter = draft?.profiles as unknown as { full_name: string; department: string } | null;
      return {
        draftId: step.draft_id,
        stepId: step.id,
        title: draft?.title ?? "",
        drafterName: drafter?.full_name ?? "",
        drafterDept: drafter?.department ?? "",
        createdAt: draft?.created_at ?? "",
      };
    });

    setItems(result);
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => { fetchInbox(); }, [fetchInbox]);

  return { items, loading, error, refetch: fetchInbox };
}
