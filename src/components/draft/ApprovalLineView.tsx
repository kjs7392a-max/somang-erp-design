"use client";

import { User, ChevronRight, Lock } from "lucide-react";
import type { ApprovalLine } from "@/lib/draft-forms";

export function ApprovalLineView({ line }: { line: ApprovalLine }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-sm font-semibold text-zinc-900">결재선</span>
        <span className="inline-flex items-center gap-0.5 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-zinc-500">
          <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
          자동 지정
        </span>
      </div>
      <div className="rounded-xl border border-zinc-100 bg-white p-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {line.map((step, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="flex flex-col items-center gap-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef2ff]">
                  <User className="h-4 w-4 text-[#3b5bdb]" strokeWidth={2.2} />
                </span>
                <span className="text-[0.6875rem] font-semibold text-zinc-700 whitespace-nowrap">
                  {step.position}
                </span>
              </div>
              {i < line.length - 1 && (
                <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" strokeWidth={2} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}