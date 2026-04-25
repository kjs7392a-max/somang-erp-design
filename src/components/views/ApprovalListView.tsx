"use client";

import { useState } from "react";
import { ChevronRight, AlertCircle, CheckCircle2, PauseCircle } from "lucide-react";

type TabKey = "pending" | "onhold" | "done";

const TABS: { key: TabKey; label: string; count: number }[] = [
  { key: "pending", label: "승인 대기", count: 7 },
  { key: "onhold", label: "보류", count: 2 },
  { key: "done", label: "완료", count: 45 },
];

type ApprovalItem = {
  id: string;
  title: string;
  drafter: string;
  dept: string;
  date: string;            // "2026-04-15"
  urgent?: boolean;
  dday?: string;           // "D-2"
  status: TabKey;
};

const ITEMS: ApprovalItem[] = [
  {
    id: "a1",
    title: "연차 신청서",
    drafter: "윤민주 간호사",
    dept: "간호과",
    date: "2026-04-15",
    urgent: true,
    dday: "D-2",
    status: "pending",
  },
  {
    id: "a2",
    title: "지출결의서",
    drafter: "김민수 행정원",
    dept: "총무과",
    date: "2026-04-14",
    dday: "D-3",
    status: "pending",
  },
  {
    id: "a3",
    title: "품의서 (장비 구매)",
    drafter: "이철수 과장",
    dept: "시설관리팀",
    date: "2026-04-13",
    dday: "D-4",
    status: "pending",
  },
  {
    id: "a4",
    title: "초과근무 신청서",
    drafter: "최영희 수간호사",
    dept: "내과 1병동",
    date: "2026-04-12",
    status: "onhold",
  },
  {
    id: "a5",
    title: "경비 청구 - 3월",
    drafter: "윤민주 간호사",
    dept: "간호과",
    date: "2026-04-01",
    status: "done",
  },
];

export type ApprovalListViewProps = {
  onOpenDetail: (id: string) => void;
};

export function ApprovalListView({ onOpenDetail }: ApprovalListViewProps) {
  const [tab, setTab] = useState<TabKey>("pending");
  const filtered = ITEMS.filter((i) => i.status === tab);

  const EmptyIcon =
    tab === "pending" ? AlertCircle : tab === "onhold" ? PauseCircle : CheckCircle2;
  const emptyLabel =
    tab === "pending"
      ? "승인 대기 중인 결재가 없습니다"
      : tab === "onhold"
        ? "보류 중인 결재가 없습니다"
        : "완료된 결재가 없습니다";

  return (
    <div className="flex flex-col">
      {/* 탭 바 */}
      <div className="sticky top-14 z-20 flex border-b border-zinc-200 bg-white">
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="relative flex-1 py-3 text-center active:bg-zinc-50"
            >
              <span
                className={`text-[0.9375rem] font-semibold ${
                  active ? "text-[#3b5bdb]" : "text-zinc-500"
                }`}
              >
                {t.label}
              </span>
              <span
                className={`ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[0.6875rem] font-bold ${
                  active
                    ? "bg-[#3b5bdb] text-white"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {t.count}
              </span>
              {active && (
                <span className="absolute bottom-0 left-1/2 h-[3px] w-12 -translate-x-1/2 rounded-full bg-[#3b5bdb]" />
              )}
            </button>
          );
        })}
      </div>

      {/* 리스트 */}
      <div className="px-5 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white py-12 text-center text-zinc-400 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <EmptyIcon className="h-10 w-10" strokeWidth={1.5} />
            <p className="text-sm">{emptyLabel}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenDetail(item.id)}
                className="block w-full rounded-2xl bg-white p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-transform active:scale-[0.98]"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.urgent && (
                      <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[0.6875rem] font-bold text-red-600">
                        <AlertCircle className="h-3 w-3" strokeWidth={2.5} />
                        긴급
                      </span>
                    )}
                    <h3 className="text-[1rem] font-bold text-zinc-900">
                      {item.title}
                    </h3>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" strokeWidth={2} />
                </div>

                <p className="mb-3 text-sm text-zinc-600">
                  {item.drafter} · {item.dept}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">{item.date}</span>
                  {item.dday && item.status === "pending" && (
                    <span
                      className={`rounded-md px-2 py-0.5 text-[0.6875rem] font-bold ${
                        item.urgent
                          ? "bg-red-50 text-red-600"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {item.dday}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}