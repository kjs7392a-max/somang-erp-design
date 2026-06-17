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
      // 기안자 본인이 결재자인 경우 스킵
      if (uuid && uuid !== profile.id) {
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

    // draft_approval_steps INSERT — 첫 번째만 pending, 나머지는 waiting
    const stepRows = steps.map((s) => ({
      draft_id: draft.id,
      approver_id: s.uuid,
      order_index: s.orderIndex,
      action: s.orderIndex === 1 ? "pending" : "waiting",
    }));

    const { error: stepsError } = await supabase
      .from("draft_approval_steps")
      .insert(stepRows);

    if (stepsError) return { error: stepsError.message };

    // 첫 번째 결재자에게 Push 알림
    const firstApproverId = steps[0]?.uuid;
    if (firstApproverId) {
      await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: firstApproverId,
          title: `${data.title} — 결재 요청`,
          body: "새 기안이 상신되었습니다",
          url: `/approval/${draft.id}`,
        }),
      }).catch(() => {});
    }

    return {};
  }

  return { submit };
}
