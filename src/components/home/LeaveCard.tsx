"use client";

import { Plane } from "lucide-react";
import { AccordionCard } from "./AccordionCard";
import { LEAVE_INFO } from "@/lib/home-data";

export function LeaveCard() {
  return (
    <AccordionCard
      title="내 잔여 월차"
      icon={<Plane className="h-5 w-5 text-[#3b5bdb]" strokeWidth={2.2} />}
      summary={
        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          사용 <strong className="text-zinc-700">{LEAVE_INFO.used}일</strong>
          <span className="text-zinc-300">·</span>
          남음 <strong className="text-[#3b5bdb]">{LEAVE_INFO.remaining}일</strong>
        </span>
      }
    >
      <div className="space-y-4">
        {/* 전체 정보 */}
        <div className="grid grid-cols-4 gap-2 rounded-xl bg-zinc-50 p-3 text-center">
          <Stat label="총" value={`${LEAVE_INFO.total}일`} />
          <Stat label="사용" value={`${LEAVE_INFO.used}일`} />
          <Stat label="남음" value={`${LEAVE_INFO.remaining}일`} highlight />
          <Stat label="이월" value={`${LEAVE_INFO.carriedOver}일`} />
        </div>

        {/* 월별 사용 */}
        <div>
          <p className="mb-2 text-xs font-semibold text-zinc-500">월별 사용 내역</p>
          <div className="grid grid-cols-4 gap-2">
            {LEAVE_INFO.monthly.map((m) => (
              <div
                key={m.month}
                className="flex flex-col items-center rounded-lg border border-zinc-100 py-2"
              >
                <span className="text-xs text-zinc-500">{m.month}</span>
                <span className="mt-0.5 text-sm font-bold text-zinc-900">
                  {m.used}일
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AccordionCard>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[0.625rem] text-zinc-500">{label}</p>
      <p
        className={`mt-0.5 text-sm font-bold ${
          highlight ? "text-[#3b5bdb]" : "text-zinc-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}