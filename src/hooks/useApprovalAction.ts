import { createClient } from "@/lib/supabase";

async function sendPush(userId: string, title: string, body: string, url: string) {
  await fetch("/api/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, title, body, url }),
  }).catch(() => {});
}

export function useApprovalAction() {
  async function approve(stepId: string): Promise<{ error?: string }> {
    const supabase = createClient();

    const { data: step } = await supabase
      .from("draft_approval_steps")
      .select("action, draft_id, order_index")
      .eq("id", stepId)
      .single();

    if (!step || step.action !== "pending") {
      return { error: "이미 처리된 결재입니다" };
    }

    const { error } = await supabase
      .from("draft_approval_steps")
      .update({ action: "approved", acted_at: new Date().toISOString() })
      .eq("id", stepId);

    if (error) return { error: error.message };

    // 기안 정보 조회 (제목, 기안자)
    const { data: draft } = await supabase
      .from("drafts")
      .select("title, drafter_id")
      .eq("id", step.draft_id)
      .single();

    // 다음 대기 step 활성화
    const { data: nextStep } = await supabase
      .from("draft_approval_steps")
      .select("id, approver_id")
      .eq("draft_id", step.draft_id)
      .eq("action", "waiting")
      .order("order_index", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextStep) {
      await supabase
        .from("draft_approval_steps")
        .update({ action: "pending" })
        .eq("id", nextStep.id);

      // 다음 결재자에게 Push
      if (draft) {
        await sendPush(
          nextStep.approver_id,
          `${draft.title} — 결재 요청`,
          "결재가 도착했어요",
          `/approval/${step.draft_id}`,
        );
      }
    } else {
      // 최종 승인
      await supabase
        .from("drafts")
        .update({ status: "approved" })
        .eq("id", step.draft_id);

      // 기안자에게 승인 완료 Push
      if (draft) {
        await sendPush(
          draft.drafter_id,
          `${draft.title} — 승인 완료`,
          "기안이 최종 승인되었습니다",
          `/approval/${step.draft_id}`,
        );
      }
    }

    return {};
  }

  async function reject(stepId: string, comment: string): Promise<{ error?: string }> {
    if (!comment.trim()) return { error: "사유를 입력하세요" };

    const supabase = createClient();

    const { data: step } = await supabase
      .from("draft_approval_steps")
      .select("action, draft_id")
      .eq("id", stepId)
      .single();

    if (!step || step.action !== "pending") {
      return { error: "이미 처리된 결재입니다" };
    }

    const { error } = await supabase
      .from("draft_approval_steps")
      .update({ action: "rejected", comment, acted_at: new Date().toISOString() })
      .eq("id", stepId);

    if (error) return { error: error.message };

    await supabase
      .from("drafts")
      .update({ status: "rejected" })
      .eq("id", step.draft_id);

    // 기안자에게 반려 Push
    const { data: draft } = await supabase
      .from("drafts")
      .select("title, drafter_id")
      .eq("id", step.draft_id)
      .single();

    if (draft) {
      await sendPush(
        draft.drafter_id,
        `${draft.title} — 반려`,
        `반려 사유: ${comment}`,
        `/approval/${step.draft_id}`,
      );
    }

    return {};
  }

  async function hold(stepId: string, comment: string): Promise<{ error?: string }> {
    if (!comment.trim()) return { error: "사유를 입력하세요" };

    const supabase = createClient();

    const { data: step } = await supabase
      .from("draft_approval_steps")
      .select("action")
      .eq("id", stepId)
      .single();

    if (!step || step.action !== "pending") {
      return { error: "이미 처리된 결재입니다" };
    }

    const { error } = await supabase
      .from("draft_approval_steps")
      .update({ action: "held", comment, acted_at: new Date().toISOString() })
      .eq("id", stepId);

    return error ? { error: error.message } : {};
  }

  return { approve, reject, hold };
}
