"use client";

import { ClipboardCheck, ChevronRight, AlertCircle } from "lucide-react";
import { AccordionCard } from "./AccordionCard";
import { useApprovalInbox, type InboxItem } from "@/hooks/useApprovalInbox";

const URGENT_HOURS = 24;

function isUrgent(item: InboxItem): boolean {
  return (Date.now() - new Date(item.createdAt).getTime()) / 3600_000 >= URGENT_HOURS;
}

export function ApprovalStatusCard({ onGoList }: { onGoList?: () => void }) {
  const { items, loading } = useApprovalInbox();
  const urgentItems = items.filter(isUrgent);

  return (
    <AccordionCard
      title="내 결재 현황"
      icon={<ClipboardCheck className="h-5 w-5 text-[#3b5bdb]" strokeWidth={2.2} />}
      summary={
        loading ? (
          <span className="text-xs text-zinc-400">불러오는 중...</span>
        ) : (
          <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span>
              승인 대기 <strong className="text-[#e03131]">{items.length}</strong>
            </span>
            {urgentItems.length > 0 && (
              <>
                <span className="mx-0.5 text-zinc-300">·</span>
                <span className="inline-flex items-center gap-0.5">
                  <AlertCircle className="h-3 w-3 text-red-500" strokeWidth={2.5} />
                  <span className="text-red-600 font-semibold">긴급 {urgentItems.length}</span>
                  <span className="max-w-[140px] truncate text-zinc-500">
                    · {urgentItems[0].title}
                  </span>
                </span>
              </>
            )}
          </span>
        )
      }
    >
      <div className="space-y-2.5">
        {loading ? (
          <p className="py-3 text-center text-sm text-zinc-400">불러오는 중...</p>
        ) : items.length === 0 ? (
          <p className="py-3 text-center text-sm text-zinc-400">결재 대기 항목이 없습니다</p>
        ) : (
          items.map((item) => (
            <div key={item.stepId} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900">{item.title}</p>
                <p className="text-xs text-zinc-500">{item.drafterName} · {item.drafterDept}</p>
              </div>
              {isUrgent(item) && (
                <span className="ml-2 inline-flex shrink-0 items-center gap-0.5 rounded-md bg-red-50 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-red-600">
                  <AlertCircle className="h-3 w-3" strokeWidth={2.5} />
                  긴급
                </span>
              )}
            </div>
          ))
        )}
        <button
          type="button"
          onClick={onGoList}
          className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl bg-zinc-50 py-2 text-sm font-semibold text-zinc-700 active:bg-zinc-100"
        >
          전체보기
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </AccordionCard>
  );
}

export function ApprovalStatusDonut({ onGoList }: { onGoList?: () => void }) {
  const { items, loading } = useApprovalInbox();
  const urgentCount = items.filter(isUrgent).length;
  const C = 2 * Math.PI * 40;

  return (
    <button
      type="button"
      onClick={onGoList}
      className="mb-3 block w-full rounded-2xl bg-white p-5 text-left shadow-[0_2px_8px_rgba(0,0,0,0.06)] active:opacity-90"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[1.0625rem] font-bold text-zinc-900">내 결재 현황</h2>
        {urgentCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
            <AlertCircle className="h-3 w-3" strokeWidth={2.5} />
            긴급 {urgentCount}
          </span>
        )}
        <ChevronRight className="h-5 w-5 text-zinc-400" />
      </div>
      {loading ? (
        <p className="py-4 text-center text-sm text-zinc-400">불러오는 중...</p>
      ) : (
        <div className="flex items-center gap-6">
          <div className="relative h-[100px] w-[100px] shrink-0">
            <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#f0f0f0" strokeWidth="16" />
              {items.length > 0 && (
                <circle
                  cx="50" cy="50" r="40"
                  fill="none" stroke="#37d5d6" strokeWidth="16"
                  strokeDasharray={`${C} 0`}
                />
              )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-zinc-900">{items.length}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center">
              <span className="mr-2 h-2 w-2 rounded-full bg-[#37d5d6]" />
              <span className="flex-1 text-sm text-zinc-600">승인 대기</span>
              <span className="text-lg font-bold text-[#37d5d6]">{items.length}</span>
            </div>
          </div>
        </div>
      )}
    </button>
  );
}
