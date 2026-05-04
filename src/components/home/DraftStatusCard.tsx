"use client";

import { FileEdit, ChevronRight } from "lucide-react";
import { AccordionCard } from "./AccordionCard";
import { useMyDrafts } from "@/hooks/useMyDrafts";

const STATUS_LABEL: Record<string, string> = {
  pending: "대기중",
  in_progress: "진행중",
  approved: "승인",
  rejected: "반려",
  held: "보류",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "text-amber-600 bg-amber-50",
  in_progress: "text-blue-600 bg-blue-50",
  approved: "text-emerald-600 bg-emerald-50",
  rejected: "text-red-600 bg-red-50",
  held: "text-zinc-600 bg-zinc-100",
};

export function DraftStatusCard({ onGoList }: { onGoList?: () => void }) {
  const { drafts, loading } = useMyDrafts();

  const inProgress = drafts.filter((d) => d.status === "pending" || d.status === "in_progress").length;
  const rejected   = drafts.filter((d) => d.status === "rejected").length;
  const done       = drafts.filter((d) => d.status === "approved").length;
  const activeDrafts = drafts.filter((d) => d.status !== "approved");

  return (
    <AccordionCard
      title="내 기안 현황"
      icon={<FileEdit className="h-5 w-5 text-[#3b5bdb]" strokeWidth={2.2} />}
      summary={
        loading ? (
          <span className="text-xs text-zinc-400">불러오는 중...</span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
            진행 <strong className="text-zinc-700">{inProgress}</strong>
            <span className="text-zinc-300">·</span>
            반려 <strong className="text-red-500">{rejected}</strong>
            <span className="text-zinc-300">·</span>
            완료 <strong className="text-zinc-700">{done}</strong>
          </span>
        )
      }
    >
      <div className="space-y-3">
        {loading ? (
          <p className="py-3 text-center text-sm text-zinc-400">불러오는 중...</p>
        ) : activeDrafts.length === 0 ? (
          <p className="py-3 text-center text-sm text-zinc-400">진행 중인 기안이 없습니다</p>
        ) : (
          activeDrafts.slice(0, 3).map((d) => (
            <div key={d.id} className="rounded-xl border border-zinc-100 bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="flex-1 text-sm font-semibold text-zinc-900">{d.title}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-bold ${STATUS_COLOR[d.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                  {STATUS_LABEL[d.status] ?? d.status}
                </span>
              </div>
              <p className="mt-1 text-[0.6875rem] text-zinc-400">{d.created_at.slice(0, 10)}</p>
            </div>
          ))
        )}
        {activeDrafts.length > 3 && (
          <button
            type="button"
            onClick={onGoList}
            className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl bg-zinc-50 py-2 text-sm font-semibold text-zinc-700 active:bg-zinc-100"
          >
            전체보기
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        )}
      </div>
    </AccordionCard>
  );
}
