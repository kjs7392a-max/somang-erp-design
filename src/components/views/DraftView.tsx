"use client";

export type DraftViewProps = {
  onBack: () => void;
};

export function DraftView({ onBack }: DraftViewProps) {
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
        <h1 className="text-lg font-bold text-[#1a1a1a]">기안하기</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <button
          type="button"
          className="mb-6 w-full cursor-pointer rounded-2xl border-none bg-[#3b5bdb] p-5 shadow-[0_4px_12px_rgba(59,91,219,0.3)] transition-transform active:scale-[0.98]"
        >
          <div className="flex items-center justify-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <line
                x1="12"
                y1="5"
                x2="12"
                y2="19"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="5"
                y1="12"
                x2="19"
                y2="12"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-lg font-bold text-white">기안작성</span>
          </div>
        </button>

        <h2 className="mb-4 text-[1.0625rem] font-bold text-[#1a1a1a]">
          자주 쓰는 기안
        </h2>
        <div className="mb-6 grid grid-cols-2 gap-3">
          {[
            {
              label: "연차신청서",
              bg: "#e8f4ff",
              icon: (
                <>
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="18"
                    rx="2"
                    stroke="#3b5bdb"
                    strokeWidth="2"
                  />
                  <line
                    x1="16"
                    y1="2"
                    x2="16"
                    y2="6"
                    stroke="#3b5bdb"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="8"
                    y1="2"
                    x2="8"
                    y2="6"
                    stroke="#3b5bdb"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="3"
                    y1="10"
                    x2="21"
                    y2="10"
                    stroke="#3b5bdb"
                    strokeWidth="2"
                  />
                </>
              ),
            },
            {
              label: "지출결의서",
              bg: "#fff4e6",
              icon: (
                <path
                  d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ),
            },
            {
              label: "근무변경신청",
              bg: "#f0fdf4",
              icon: (
                <>
                  <circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="2" />
                  <path
                    d="M12 6v6l4 2"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </>
              ),
            },
            {
              label: "품의서",
              bg: "#fef2f2",
              icon: (
                <>
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="14,2 14,8 20,8"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              ),
            },
          ].map(({ label, bg, icon }) => (
            <button
              key={label}
              type="button"
              className="cursor-pointer rounded-xl border border-[#e0e0e0] bg-white p-4 transition-transform active:scale-95"
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: bg }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    {icon}
                  </svg>
                </div>
                <span className="text-sm font-semibold text-[#333]">{label}</span>
              </div>
            </button>
          ))}
        </div>

        <h2 className="mb-4 text-[1.0625rem] font-bold text-[#1a1a1a]">내 문서</h2>
        {[
          {
            status: "승인완료",
            color: "#10b981",
            count: "12건",
            docs: [
              { title: "연차신청서 (2024-04-15)", date: "2024-04-10" },
              { title: "지출결의서 (사무용품 구매)", date: "2024-04-08" },
            ],
          },
          {
            status: "대기중",
            color: "#f59e0b",
            count: "3건",
            docs: [{ title: "품의서 (장비 구매)", date: "2024-04-16" }],
          },
          {
            status: "반려",
            color: "#ef4444",
            count: "1건",
            docs: [{ title: "지출결의서 (출장비)", date: "2024-04-12" }],
          },
        ].map(({ status, color, count, docs }) => (
          <div
            key={status}
            className="mb-3 rounded-xl border border-[#e0e0e0] bg-white p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ background: color }}
                />
                <span
                  className="text-sm font-semibold"
                  style={{ color }}
                >
                  {status}
                </span>
              </div>
              <span className="text-xs text-[#999]">{count}</span>
            </div>
            <div className="space-y-2">
              {docs.map(({ title, date }, i, arr) => (
                <div
                  key={title}
                  className={
                    i < arr.length - 1 ? "border-b border-gray-100 py-2" : "py-2"
                  }
                >
                  <div className="mb-1 text-[0.9375rem] font-semibold text-[#333]">
                    {title}
                  </div>
                  <div className="text-[0.8125rem] text-[#999]">작성일: {date}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
