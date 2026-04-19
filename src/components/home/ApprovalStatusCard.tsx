"use client";

import { ClipboardCheck, ChevronRight, AlertCircle } from "lucide-react";
import { AccordionCard } from "./AccordionCard";

type Row = { label: string; value: number; color: string };
const ROWS: Row[] = [
  { label: "승인 대기", value: 7,  color: "#37d5d6" },
  { label: "보류",     value: 2,  color: "#2c5aa0" },
  { label: "완료",     value: 45, color: "#6b9ef5" },
];
const URGENT_TITLE = "연차 신청서 (박지영)";

/** 카드 형태 (직원/관리자용) */
export function ApprovalStatusCard({
  onGoList,
}: {
  onGoList?: () => void;
}) {
  return (
    <AccordionCard
      title="내 결재 현황"
      icon={<ClipboardCheck className="h-5 w-5 text-[#3b5bdb]" strokeWidth={2.2} />}
      summary={
        <span className="flex items-center gap-1.5">
          승인 대기 <strong className="text-[#e03131]">7</strong>
          <span className="mx-1 text-zinc-300">·</span>
          <AlertCircle className="h-3 w-3 text-red-500" strokeWidth={2.5} />
          긴급: {URGENT_TITLE.split(" ")[0]}
        </span>
      }
    >
      <div className="space-y-2.5">
        {ROWS.map((r) => (
          <div key={r.label} className="flex items-center">
            <span
              className="mr-2 h-2 w-2 rounded-full"
              style={{ background: r.color }}
            />
            <span className="flex-1 text-sm text-zinc-600">{r.label}</span>
            <span className="text-base font-bold" style={{ color: r.color }}>
              {r.value}
            </span>
          </div>
        ))}
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

/** 도넛 형태 (임원용) */
export function ApprovalStatusDonut({
  onGoList,
}: {
  onGoList?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onGoList}
      className="mb-3 block w-full rounded-2xl bg-white p-5 text-left shadow-[0_2px_8px_rgba(0,0,0,0.06)] active:opacity-90"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[1.0625rem] font-bold text-zinc-900">
          내 결재 현황
        </h2>
        <ChevronRight className="h-5 w-5 text-zinc-400" />
      </div>
      <div className="flex items-center gap-6">
        <div className="relative h-[100px] w-[100px] shrink-0">
          <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#f0f0f0" strokeWidth="16" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#6b9ef5" strokeWidth="16"
              strokeDasharray="209 251.2" strokeDashoffset="0" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#2c5aa0" strokeWidth="16"
              strokeDasharray="9.3 251.2" strokeDashoffset="-209" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#37d5d6" strokeWidth="16"
              strokeDasharray="32.6 251.2" strokeDashoffset="-218.3" />
          </svg>
        </div>
        <div className="flex flex-1 flex-col gap-2.5">
          {ROWS.map((r) => (
            <div key={r.label} className="flex items-center">
              <span className="mr-2 h-2 w-2 rounded-full" style={{ background: r.color }} />
              <span className="flex-1 text-sm text-zinc-600">{r.label}</span>
              <span className="text-lg font-bold" style={{ color: r.color }}>
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}