"use client";

import { useRouter } from "next/navigation";
import { ApprovalListView } from "@/components/views/ApprovalListView";
import { ROUTES } from "@/lib/routes";

export default function ApprovalListPage() {
  const router = useRouter();

  return (
    <ApprovalListView
      onOpenDetail={(id) => router.push(`${ROUTES.approval}/${id}`)}
    />
  );
}