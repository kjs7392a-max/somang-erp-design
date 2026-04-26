"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApprovalDetailView } from "@/components/views/ApprovalDetailView";
import { useAuth } from "@/context/AuthContext";
import { useDraftDetail } from "@/hooks/useDraftDetail";
import { useApprovalAction } from "@/hooks/useApprovalAction";
import { ROUTES } from "@/lib/routes";
import type { ApprovalDetailTab } from "@/types/navigation";

export function ApprovalDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { profile } = useAuth();
  const { detail, loading, refetch } = useDraftDetail(id);
  const { approve, reject, hold } = useApprovalAction();

  const [activeTab, setActiveTab] = useState<ApprovalDetailTab>("summary");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [holdReason, setHoldReason] = useState("");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-zinc-400">
        불러오는 중...
      </div>
    );
  }
  if (!detail) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-zinc-400">
        문서를 찾을 수 없습니다
      </div>
    );
  }

  // 현재 로그인 사용자의 pending step (없으면 결재 버튼 숨김)
  const myStep = profile
    ? detail.steps.find((s) => s.approver_id === profile.id && s.action === "pending")
    : undefined;

  const handleApprove = async () => {
    if (!myStep) return;
    const result = await approve(myStep.id);
    if (result.error) { alert(result.error); return; }
    await refetch();
    router.push(ROUTES.approval);
  };

  const handleConfirmReject = async () => {
    if (!myStep) return;
    const result = await reject(myStep.id, rejectReason);
    if (result.error) { alert(result.error); return; }
    setShowRejectModal(false);
    setRejectReason("");
    await refetch();
    router.push(ROUTES.approval);
  };

  const handleConfirmHold = async () => {
    if (!myStep) return;
    const result = await hold(myStep.id, holdReason);
    if (result.error) { alert(result.error); return; }
    setShowHoldModal(false);
    setHoldReason("");
    await refetch();
    router.push(ROUTES.approval);
  };

  // 내 차례가 아니면 실제 status 전달 → 결재 버튼 숨김
  const docStatus: "pending" | "approved" | "rejected" = myStep
    ? "pending"
    : detail.status === "approved"
      ? "approved"
      : detail.status === "rejected"
        ? "rejected"
        : "pending";

  return (
    <ApprovalDetailView
      draft={detail}
      activeTab={activeTab}
      onActiveTabChange={setActiveTab}
      showRejectModal={showRejectModal}
      showHoldModal={showHoldModal}
      rejectReason={rejectReason}
      holdReason={holdReason}
      onRejectReasonChange={setRejectReason}
      onHoldReasonChange={setHoldReason}
      onOpenRejectModal={() => setShowRejectModal(true)}
      onCloseRejectModal={() => setShowRejectModal(false)}
      onOpenHoldModal={() => setShowHoldModal(true)}
      onCloseHoldModal={() => setShowHoldModal(false)}
      onBack={() => router.push(ROUTES.approval)}
      docStatus={docStatus}
      onApprove={myStep ? handleApprove : undefined}
      onConfirmReject={myStep ? handleConfirmReject : undefined}
      onConfirmHold={myStep ? handleConfirmHold : undefined}
    />
  );
}
