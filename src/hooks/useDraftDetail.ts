import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export type StepDetail = {
  id: string;
  order_index: number;
  approver_id: string;
  approverName: string;
  approverDept: string;
  action: string;
  comment: string | null;
  acted_at: string | null;
};

export type DraftDetail = {
  id: string;
  title: string;
  doc_type: string;
  status: string;
  created_at: string;
  drafterName: string;
  drafterDept: string;
  body: Record<string, unknown>;
  steps: StepDetail[];
};

export function useDraftDetail(draftId: string) {
  const [detail, setDetail] = useState<DraftDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!draftId) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data, error: dbError } = await supabase
      .from("drafts")
      .select(`
        id, title, doc_type, status, created_at,
        profiles!drafter_id(full_name, department),
        document_contents(body),
        draft_approval_steps(
          id, order_index, approver_id, action, comment, acted_at,
          profiles!approver_id(full_name, department)
        )
      `)
      .eq("id", draftId)
      .single();

    setLoading(false);
    if (dbError || !data) { setError(dbError?.message ?? "조회 실패"); return; }

    const drafter = data.profiles as { full_name: string; department: string } | null;
    const contents = data.document_contents as { body: Record<string, unknown> } | null;
    const rawSteps = (data.draft_approval_steps as any[]) ?? [];

    setDetail({
      id: data.id,
      title: data.title,
      doc_type: data.doc_type,
      status: data.status,
      created_at: data.created_at,
      drafterName: drafter?.full_name ?? "",
      drafterDept: drafter?.department ?? "",
      body: contents?.body ?? {},
      steps: rawSteps
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((s: any) => {
          const approver = s.profiles as { full_name: string; department: string } | null;
          return {
            id: s.id,
            order_index: s.order_index,
            approver_id: s.approver_id,
            approverName: approver?.full_name ?? "",
            approverDept: approver?.department ?? "",
            action: s.action,
            comment: s.comment ?? null,
            acted_at: s.acted_at ?? null,
          };
        }),
    });
  }, [draftId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  return { detail, loading, error, refetch: fetchDetail };
}
