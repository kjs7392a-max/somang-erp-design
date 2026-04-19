"use client";

import {
  Plane,
  Clock,
  Receipt,
  ShoppingCart,
  HeartPulse,
  FileText,
  Plus,
  ChevronRight,
} from "lucide-react";

export type DraftViewProps = {
  onBack?: () => void;
};

type QuickDraft = {
  key: string;
  label: string;
  Icon: typeof Plane;
  bg: string;
  tint: string;
};

const QUICK_DRAFTS: QuickDraft[] = [
  { key: "vacation", label: "연차 신청서", Icon: Plane, bg: "#e8f4ff", tint: "#3b5bdb" },
  { key: "overtime", label: "초과근무 신청", Icon: Clock, bg: "#fff4e6", tint: "#f08c00" },
  { key: "expense", label: "경비 청구", Icon: Receipt, bg: "#e6fcf5", tint: "#0ca678" },
  { key: "purchase", label: "물품 구매 요청", Icon: ShoppingCart, bg: "#fff0f6", tint: "#d6336c" },
  { key: "medical", label: "의료 행위 보고", Icon: HeartPulse, bg: "#f3f0ff", tint: "#7048e8" },
  { key: "general", label: "일반 기안", Icon: FileText, bg: "#f1f3f5", tint: "#495057" },
];

const RECENT_DRAFTS = [
  { id: 1, title: "연차 신청서", date: "2026.04.15", status: "임시저장" },
  { id: 2, title: "경비 청구 - 3월", date: "2026.04.02", status: "임시저장" },
];

export function DraftView(_props: DraftViewProps) {
  return (
    <div className="px-5 py-5">
      {/* 큰 CTA: 새 기안 작성 */}
      <button
        type="button"
        className="mb-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#3b5bdb] p-5 shadow-[0_4px_12px_rgba(59,91,219,0.28)] transition-transform active:scale-[0.98]"
      >
        <Plus className="h-6 w-6 text-white" strokeWidth={2.5} />
        <span className="text-[1.0625rem] font-bold text-white">새 기안 작성</span>
      </button>

      {/* 자주 쓰는 기안 */}
      <section className="mb-6">
        <h2 className="mb-3 text-[1.0625rem] font-bold text-zinc-900">
          자주 쓰는 기안
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_DRAFTS.map(({ key, label, Icon, bg, tint }) => (
            <button
              key={key}
              type="button"
              className="flex flex-col items-start gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] active:scale-[0.98]"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: bg }}
              >
                <Icon className="h-5 w-5" strokeWidth={2} style={{ color: tint }} />
              </span>
              <span className="text-[0.9375rem] font-semibold text-zinc-900">
                {label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 임시 저장 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[1.0625rem] font-bold text-zinc-900">임시 저장</h2>
          <span className="text-sm text-zinc-400">{RECENT_DRAFTS.length}</span>
        </div>
        {RECENT_DRAFTS.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-zinc-400">
            임시 저장된 기안이 없습니다
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            {RECENT_DRAFTS.map((d, i) => (
              <button
                key={d.id}
                type="button"
                className={`flex w-full items-center gap-3 px-5 py-4 text-left active:bg-zinc-50 ${
                  i < RECENT_DRAFTS.length - 1 ? "border-b border-zinc-100" : ""
                }`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100">
                  <FileText className="h-4 w-4 text-zinc-500" strokeWidth={2} />
                </span>
                <div className="flex-1">
                  <p className="text-[0.9375rem] font-semibold text-zinc-900">
                    {d.title}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {d.date} · {d.status}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-400" strokeWidth={2} />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
