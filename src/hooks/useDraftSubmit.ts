import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase";
import { getApproverByPosition } from "@/lib/approval-approvers";
import { FORMS, type FormKind } from "@/lib/draft-forms";

export type DraftSubmitData = {
  title: string;
  docType: FormKind;
  body: Record<string, unknown>;
};

export function useDraftSubmit() {
  const { profile } = useAuth();

  async function submit(data: DraftSubmitData): Promise<{ error?: string }> {
    if (!profile) return { error: "로그인이 필요합니다" };

    const supabase = createClient();

    // 결재선 UUID 변환
    const approvalLine = FORMS[data.docType].approvalLine;
    const steps: { uuid: string; orderIndex: number }[] = [];
    let orderIndex = 1;
    for (const step of approvalLine) {
      let uuid: string | null;
      try {
        uuid = getApproverByPosition(step.position);
      } catch (e) {
        return { error: (e as Error).message };
      }
      if (uuid) {
        steps.push({ uuid, orderIndex });
        orderIndex++;
      }
    }

    if (steps.length === 0) {
      return { error: "결재자가 지정되지 않았습니다" };
    }

    // drafts INSERT
    const { data: draft, error: draftError } = await supabase
      .from("drafts")
      .insert({
        corporation_id: profile.corporation_id,
        drafter_id: profile.id,
        title: data.title,
        doc_type: data.docType,
        status: "pending",
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (draftError || !draft) {
      return { error: draftError?.message ?? "기안 생성 실패" };
    }

    // document_contents INSERT
    const { error: contentsError } = await supabase
      .from("document_contents")
      .insert({
        draft_id: draft.id,
        body: data.body,
        attachments: [],
      });

    if (contentsError) return { error: contentsError.message };

    // draft_approval_steps INSERT
    const stepRows = steps.map((s) => ({
      draft_id: draft.id,
      approver_id: s.uuid,
      order_index: s.orderIndex,
      action: "pending",
    }));

    const { error: stepsError } = await supabase
      .from("draft_approval_steps")
      .insert(stepRows);

    if (stepsError) return { error: stepsError.message };

    return {};
  }

  return { submit };
}
