"use client";

import { FileEdit, Check, Clock, X, User } from "lucide-react";
import { AccordionCard } from "./AccordionCard";
import { DRAFT_COUNTS, MY_DRAFTS, type ApproverStep } from "@/lib/home-data";

export function DraftStatusCard() {
  const pending = MY_DRAFTS.filter((d) => d.status === "pending");

  return (
    <AccordionCard
      title="내 기안 현황"
      icon={<FileEdit className="h-5 w-5 text-[#3b5bdb]" strokeWidth={2.2} />}
      summary={
        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          진행 <strong className="text-zinc-700">{DRAFT_COUNTS.pending}</strong>
          <span className="text-zinc-300">·</span>
          반려 <strong className="text-red-500">{DRAFT_COUNTS.rejected}</strong>
          <span className="text-zinc-300">·</span>
          완료 <strong className="text-zinc-700">{DRAFT_COUNTS.done}</strong>
        </span>
      }
    >
      <div className="space-y-3">
        {pending.length === 0 && (
          <p className="py-3 text-center text-sm text-zinc-400">
            진행 중인 기안이 없습니다
          </p>
        )}
        {pending.map((d) => {
          const doneCount = d.approvalLine.filter((s) => s.state === "done").length;
          const total = d.approvalLine.length;
          return (
            <div
              key={d.id}
              className="rounded-xl border border-zinc-100 bg-white p-3"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="flex-1 text-sm font-semibold text-zinc-900">
                  {d.title}
                </p>
                <span className="shrink-0 rounded-full bg-[#eef2ff] px-2 py-0.5 text-[0.6875rem] font-bold text-[#3b5bdb]">
                  {doneCount}/{total}
                </span>
              </div>
              <ApprovalLine line={d.approvalLine} />
              <p className="mt-1.5 text-[0.6875rem] text-zinc-400">{d.date}</p>
            </div>
          );
        })}
      </div>
    </AccordionCard>
  );
}

function ApprovalLine({ line }: { line: ApproverStep[] }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {line.map((step, i) => (
        <div key={i} className="flex items-center gap-1">
          <Step step={step} />
          {i < line.length - 1 && (
            <span className="h-px w-2 shrink-0 bg-zinc-200" />
          )}
        </div>
      ))}
    </div>
  );
}

function Step({ step }: { step: ApproverStep }) {
  const style = {
    done: { bg: "#d3f9d8", fg: "#2f9e44", icon: <Check className="h-3 w-3" strokeWidth={2.5} /> },
    current: { bg: "#fff3bf", fg: "#e67700", icon: <Clock className="h-3 w-3" strokeWidth={2.5} /> },
    waiting: { bg: "#f1f3f5", fg: "#868e96", icon: <User className="h-3 w-3" strokeWidth={2.2} /> },
    rejected: { bg: "#ffe3e3", fg: "#e03131", icon: <X className="h-3 w-3" strokeWidth={2.5} /> },
  }[step.state];

  return (
    <div
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${
        step.state === "current" ? "ring-1 ring-[#e67700]" : ""
      }`}
      style={{ background: style.bg, color: style.fg }}
    >
      <span>{style.icon}</span>
      <span className="text-[0.625rem] font-semibold whitespace-nowrap">
        {step.name}
      </span>
    </div>
  );
}