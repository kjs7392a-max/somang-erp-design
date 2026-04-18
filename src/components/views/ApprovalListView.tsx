"use client";

export type ApprovalListViewProps = {
  onBack: () => void;
  onOpenDetail: () => void;
};

export function ApprovalListView({ onBack, onOpenDetail }: ApprovalListViewProps) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-[#f5f5f5]">
      <div className="flex items-center justify-between border-b border-[#e0e0e0] bg-white px-5 py-4">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer border-none bg-transparent p-2"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="#333"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-[#1a1a1a]">결재함</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <h2 className="text-[1.0625rem] font-bold text-[#1a1a1a]">승인 대기</h2>
            </div>
            <span className="text-sm text-[#999]">7건</span>
          </div>
          <div className="space-y-3">
            {[
              {
                title: "연차신청서",
                sub: "박지영 간호사 · 내과 2병동",
                date: "2026-04-15",
                badge: "긴급",
                badgeBg: "#fef3c7",
                badgeColor: "#f59e0b",
                dday: "D-2",
                ddayColor: "#f59e0b",
              },
              {
                title: "지출결의서",
                sub: "김민수 행정팀 · 총무과",
                date: "2026-04-14",
                badge: "",
                badgeBg: "",
                badgeColor: "",
                dday: "D-3",
                ddayColor: "#999",
              },
              {
                title: "품의서 (장비 구매)",
                sub: "이준호 과장 · 시설관리팀",
                date: "2026-04-13",
                badge: "",
                badgeBg: "",
                badgeColor: "",
                dday: "D-4",
                ddayColor: "#999",
              },
            ].map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={onOpenDetail}
                className="w-full cursor-pointer rounded-xl border border-[#e0e0e0] bg-white p-4 text-left transition-transform active:scale-[0.98]"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="text-base font-bold text-[#1a1a1a]">{item.title}</div>
                  {item.badge ? (
                    <div
                      className="rounded-md px-2 py-1 text-xs font-semibold"
                      style={{ background: item.badgeBg, color: item.badgeColor }}
                    >
                      {item.badge}
                    </div>
                  ) : null}
                </div>
                <div className="mb-2 text-sm text-[#666]">{item.sub}</div>
                <div className="flex items-center justify-between">
                  <span className="text-[0.8125rem] text-[#999]">{item.date}</span>
                  <span
                    className="text-[0.8125rem] font-semibold"
                    style={{ color: item.ddayColor }}
                  >
                    {item.dday}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-indigo-500" />
              <h2 className="text-[1.0625rem] font-bold text-[#1a1a1a]">보류</h2>
            </div>
            <span className="text-sm text-[#999]">2건</span>
          </div>
          <div className="space-y-3">
            {[
              {
                title: "근무변경신청",
                sub: "최서연 간호사 · 외과 1병동",
                date: "2026-04-10",
                reason: "대체 근무자 확인 필요",
              },
              {
                title: "지출결의서 (교육비)",
                sub: "정민지 주임 · 교육팀",
                date: "2026-04-09",
                reason: "예산 확인 중",
              },
            ].map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={onOpenDetail}
                className="w-full cursor-pointer rounded-xl border border-[#e0e0e0] bg-white p-4 text-left transition-transform active:scale-[0.98]"
              >
                <div className="mb-2 text-base font-bold text-[#1a1a1a]">{item.title}</div>
                <div className="mb-2 text-sm text-[#666]">{item.sub}</div>
                <div className="mb-2 text-[0.8125rem] text-[#999]">{item.date}</div>
                <div className="rounded-lg bg-[#f0f0f0] px-3 py-2 text-[0.8125rem] text-[#666]">
                  보류 사유: {item.reason}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <h2 className="text-[1.0625rem] font-bold text-[#1a1a1a]">승인 완료</h2>
            </div>
            <span className="text-sm text-[#999]">45건</span>
          </div>
          <div className="space-y-3">
            {[
              {
                title: "연차신청서",
                sub: "강태희 간호사 · 응급실",
                date: "2026-04-12",
              },
              {
                title: "품의서 (사무용품)",
                sub: "윤하영 사원 · 총무과",
                date: "2026-04-11",
              },
            ].map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={onOpenDetail}
                className="w-full cursor-pointer rounded-xl border border-[#e0e0e0] bg-white p-4 text-left transition-transform active:scale-[0.98]"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="text-base font-bold text-[#1a1a1a]">{item.title}</div>
                  <div className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-500">
                    승인
                  </div>
                </div>
                <div className="mb-2 text-sm text-[#666]">{item.sub}</div>
                <div className="text-[0.8125rem] text-[#999]">{item.date}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
