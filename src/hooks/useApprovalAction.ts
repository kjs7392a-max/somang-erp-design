import { createClient } from "@/lib/supabase";

export function useApprovalAction() {
  async function approve(stepId: string): Promise<{ error?: string }> {
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
      .update({ action: "approved", acted_at: new Date().toISOString() })
      .eq("id", stepId);

    return error ? { error: error.message } : {};
  }

  async function reject(stepId: string, comment: string): Promise<{ error?: string }> {
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
      .update({ action: "rejected", comment, acted_at: new Date().toISOString() })
      .eq("id", stepId);

    return error ? { error: error.message } : {};
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
