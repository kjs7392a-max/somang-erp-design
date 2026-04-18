"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApprovalDetailView } from "@/components/views/ApprovalDetailView";
import { ROUTES } from "@/lib/routes";
import type { ApprovalDetailTab } from "@/types/navigation";

export function ApprovalDetailClient({ id }: { id: string }) {
  void id;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ApprovalDetailTab>("summary");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [holdReason, setHoldReason] = useState("");

  return (
    <ApprovalDetailView
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
    />
  );
}
