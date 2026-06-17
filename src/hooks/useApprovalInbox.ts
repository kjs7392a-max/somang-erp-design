import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase";
import type { ApprovalStep } from "@/hooks/useMyDrafts";

export type InboxItem = {
  draftId: string;
  stepId: string;
  title: string;
  drafterName: string;
  drafterDept: string;
  createdAt: string;
  steps?: ApprovalStep[];
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

    // 내 차례인 step만 조회 (action = "pending")
    // waiting/approved 단계 도입으로 min order_index 로직 불필요
    const { data: mySteps, error: e1 } = await supabase
      .from("draft_approval_steps")
      .select("id, draft_id")
      .eq("approver_id", profile.id)
      .eq("action", "pending");

    if (e1) { setError(e1.message); setLoading(false); return; }
    if (!mySteps || mySteps.length === 0) { setItems([]); setLoading(false); return; }

    const draftIds = mySteps.map((s) => s.draft_id);

    const { data: drafts, error: e2 } = await supabase
      .from("drafts")
      .select("id, title, created_at, profiles!drafter_id(full_name, department)")
      .in("id", draftIds);

    if (e2) { setError(e2.message); setLoading(false); return; }

    const result: InboxItem[] = mySteps.map((step) => {
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
