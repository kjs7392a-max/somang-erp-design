"use client";

import { useRouter } from "next/navigation";
import { ApprovalListView } from "@/components/views/ApprovalListView";
import { ROUTES } from "@/lib/routes";

export default function ApprovalListPage() {
  const router = useRouter();

  return (
    <ApprovalListView
      onBack={() => router.push(ROUTES.home)}
      onOpenDetail={() => router.push(ROUTES.approvalDetail("1"))}
    />
  );
}
