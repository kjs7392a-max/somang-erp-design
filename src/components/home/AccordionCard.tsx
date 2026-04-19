"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type AccordionCardProps = {
  title: string;
  /** 접힌 상태에 타이틀 오른쪽 표시될 요약 */
  summary?: React.ReactNode;
  /** 아이콘 (왼쪽) */
  icon?: React.ReactNode;
  /** 펼친 상태 내용 */
  children: React.ReactNode;
  /** 초기 펼침 여부 */
  defaultOpen?: boolean;
};

export function AccordionCard({
  title,
  summary,
  icon,
  children,
  defaultOpen = false,
}: AccordionCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-3 overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left active:bg-zinc-50"
      >
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef2ff]">
            {icon}
          </span>
        )}
        <div className="flex-1">
          <p className="text-[0.9375rem] font-bold text-zinc-900">{title}</p>
          {summary && (
            <div className="mt-0.5 text-xs text-zinc-500">{summary}</div>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={2}
        />
      </button>
      {open && (
        <div className="border-t border-zinc-100 px-5 py-4">{children}</div>
      )}
    </div>
  );
}