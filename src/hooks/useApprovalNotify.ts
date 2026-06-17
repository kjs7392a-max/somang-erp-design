"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase";
import { useNotifications } from "@/context/NotificationsContext";

export function useApprovalNotify() {
  const { profile } = useAuth();
  const { push } = useNotifications();

  useEffect(() => {
    if (!profile) return;
    const supabase = createClient();

    // 결재 차례 알림: 내 step이 pending으로 변경될 때 (INSERT 또는 UPDATE)
    const stepChannel = supabase
      .channel(`approval-notify-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "draft_approval_steps",
          filter: `approver_id=eq.${profile.id}`,
        },
        async (payload) => {
          const row = payload.new as { action: string; draft_id: string };
          if (row.action !== "pending") return;
          await notifyApprovalArrived(row.draft_id);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "draft_approval_steps",
          filter: `approver_id=eq.${profile.id}`,
        },
        async (payload) => {
          const row = payload.new as { action: string; draft_id: string };
          if (row.action !== "pending") return;
          await notifyApprovalArrived(row.draft_id);
        },
      )
      .subscribe();

    // 기안 최종 처리 알림: 내 기안 status가 approved/rejected로 바뀔 때
    const draftChannel = supabase
      .channel(`draft-notify-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "drafts",
          filter: `drafter_id=eq.${profile.id}`,
        },
        (payload) => {
          const row = payload.new as { status: string; title: string; id: string };
          if (row.status === "approved") {
            push({
              kind: "approved",
              title: `${row.title} — 승인 완료`,
              body: "기안이 최종 승인되었습니다",
              deeplink: { type: "mydoc", docId: row.id },
            });
          } else if (row.status === "rejected") {
            push({
              kind: "rejected",
              title: `${row.title} — 반려`,
              body: "기안이 반려되었습니다",
              deeplink: { type: "mydoc", docId: row.id },
            });
          }
        },
      )
      .subscribe();

    async function notifyApprovalArrived(draftId: string) {
      const { data } = await supabase
        .from("drafts")
        .select("title, profiles!drafter_id(full_name)")
        .eq("id", draftId)
        .single();
      const drafterName = (data?.profiles as unknown as { full_name: string } | null)?.full_name ?? "";
      push({
        kind: "approval",
        title: `${drafterName} — ${data?.title ?? "기안"}`,
        body: "결재가 도착했어요",
        deeplink: { type: "approval", docId: draftId },
      });
    }

    return () => {
      supabase.removeChannel(stepChannel);
      supabase.removeChannel(draftChannel);
    };
  }, [profile?.id, push]);
}
