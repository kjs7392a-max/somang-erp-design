import { cn } from "@/lib/utils/cn";
import type { ApprovalStatus } from "@/types";

const statusConfig: Record<ApprovalStatus, { label: string; className: string }> = {
  pending: { label: "대기", className: "bg-yellow-100 text-yellow-700" },
  approved: { label: "승인", className: "bg-green-100 text-green-700" },
  rejected: { label: "반려", className: "bg-red-100 text-red-700" },
  held: { label: "보류", className: "bg-gray-100 text-gray-600" },
};

interface BadgeProps {
  status: ApprovalStatus;
  className?: string;
}

export default function Badge({ status, className }: BadgeProps) {
  const { label, className: statusClass } = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        statusClass,
        className
      )}
    >
      {label}
    </span>
  );
}
