"use client";

export type ScheduleEventItem = {
  title: string;
  time: string;
  color: string;
  /** Google 연동 시 제목 마스킹(원스탑 일정 프라이버시) */
  isPrivate?: boolean;
};

export type CalendarViewProps = {
  scheduleCurrentDate: Date;
  onScheduleCurrentDateChange: (d: Date) => void;
  selectedCalendarDay: number;
  onSelectedCalendarDayChange: (day: number) => void;
  googleCalendarConnected: boolean;
  onGoogleCalendarConnectedChange: (v: boolean) => void;
};

const MONTH_NAMES = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function maskPrivateTitle(title: string) {
  if (!title.trim()) return "비공개 일정";
  return title.replace(/./g, "•");
}

const SCHEDULE_EVENTS: Record<number, ScheduleEventItem[]> = {
  4: [{ title: "병동 간호사 회의", time: "09:00", color: "#3b5bdb" }],
  7: [{ title: "월례 교육", time: "14:00", color: "#f59e0b" }],
  10: [{ title: "연차 (박지영)", time: "종일", color: "#10b981" }],
  15: [{ title: "부서장 회의", time: "15:00", color: "#6366f1" }],
  18: [
    { title: "진료팀 미팅", time: "11:00", color: "#3b5bdb" },
    { title: "원무팀 협의", time: "14:30", color: "#ef4444" },
    {
      title: "대외비 검진 협의",
      time: "16:00",
      color: "#9ca3af",
      isPrivate: true,
    },
  ],
  20: [{ title: "통합 워크숍", time: "10:00", color: "#ef4444" }],
  22: [{ title: "신규 간호사 OT", time: "09:00", color: "#f59e0b" }],
  25: [{ title: "품질향상위원회", time: "14:00", color: "#6366f1" }],
  28: [{ title: "월말 결산 보고", time: "16:00", color: "#2c5aa0" }],
};

export function CalendarView({
  scheduleCurrentDate,
  onScheduleCurrentDateChange,
  selectedCalendarDay,
  onSelectedCalendarDayChange,
  googleCalendarConnected,
  onGoogleCalendarConnectedChange,
}: CalendarViewProps) {
  const year = scheduleCurrentDate.getFullYear();
  const month = scheduleCurrentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const selectedEvents = selectedCalendarDay
    ? SCHEDULE_EVENTS[selectedCalendarDay] || []
    : [];

  const displayEventTitle = (ev: ScheduleEventItem) => {
    if (googleCalendarConnected && ev.isPrivate) return maskPrivateTitle(ev.title);
    return ev.title;
  };

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#f5f5f5]">
      <div className="flex items-center justify-between border-b border-[#e0e0e0] bg-white px-5 py-4">
        <h1 className="m-0 text-lg font-bold text-[#1a1a1a]">일정</h1>
        <button
          type="button"
          className="cursor-pointer border-none bg-transparent p-1.5"
          aria-label="일정 추가"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <line
              x1="12"
              y1="5"
              x2="12"
              y2="19"
              stroke="#333"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line
              x1="5"
              y1="12"
              x2="19"
              y2="12"
              stroke="#333"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div
        className={
          googleCalendarConnected
            ? "bg-emerald-50 px-4 py-3"
            : "bg-orange-50 px-4 py-3"
        }
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div
              className={`text-[0.8125rem] font-bold ${
                googleCalendarConnected ? "text-[#2e7d32]" : "text-[#e65100]"
              }`}
            >
              {googleCalendarConnected
                ? "Google Calendar 연동됨"
                : "Google Calendar 미연동"}
            </div>
            <div className="text-xs text-[#666]">
              {googleCalendarConnected
                ? "jypark@somang.or.kr"
                : "실제 연동 시 GOOGLE_CALENDAR_API_KEY 설정 필요"}
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              onGoogleCalendarConnectedChange(!googleCalendarConnected)
            }
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
              googleCalendarConnected
                ? "border border-[#4285F4] bg-white text-[#4285F4]"
                : "border-none bg-[#4285F4] text-white"
            }`}
          >
            {googleCalendarConnected ? "연동 해제" : "연동하기"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="m-4 overflow-hidden rounded-[20px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between px-5 pb-3 pt-4">
            <button
              type="button"
              onClick={() =>
                onScheduleCurrentDateChange(new Date(year, month - 1, 1))
              }
              className="cursor-pointer border-none bg-transparent p-1.5"
              aria-label="이전 달"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="#333"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className="text-lg font-bold text-[#1a1a1a]">
              {year}년 {MONTH_NAMES[month]}
            </div>
            <button
              type="button"
              onClick={() =>
                onScheduleCurrentDateChange(new Date(year, month + 1, 1))
              }
              className="cursor-pointer border-none bg-transparent p-1.5"
              aria-label="다음 달"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18l6-6-6-6"
                  stroke="#333"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-7 px-2">
            {DAY_NAMES.map((d, i) => (
              <div
                key={d}
                className={`py-1.5 text-center text-xs font-semibold ${
                  i === 0
                    ? "text-red-500"
                    : i === 6
                      ? "text-[#3b5bdb]"
                      : "text-[#888]"
                }`}
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5 px-2 pb-3">
            {calendarCells.map((day, idx) => {
              const colIdx = idx % 7;
              const isToday = day === 18 && month === 3 && year === 2026;
              const isSelected = day === selectedCalendarDay;
              const hasEvents = day !== null && SCHEDULE_EVENTS[day];
              return (
                <div
                  key={idx}
                  role={day ? "button" : undefined}
                  tabIndex={day ? 0 : -1}
                  onClick={() => day && onSelectedCalendarDayChange(day)}
                  onKeyDown={(e) => {
                    if (day && (e.key === "Enter" || e.key === " "))
                      onSelectedCalendarDayChange(day);
                  }}
                  className={`flex min-h-11 flex-col items-center rounded-[10px] p-0.5 ${
                    day ? "cursor-pointer" : "cursor-default"
                  } ${isSelected ? "bg-[#3b5bdb]" : "bg-transparent"}`}
                >
                  <div
                    className={`flex h-[30px] w-[30px] items-center justify-center rounded-full text-sm ${
                      isSelected
                        ? "font-bold text-white"
                        : isToday
                          ? "bg-[#e8f0fe] font-bold text-[#3b5bdb]"
                          : colIdx === 0
                            ? "font-medium text-red-500"
                            : colIdx === 6
                              ? "font-medium text-[#3b5bdb]"
                              : day
                                ? "font-medium text-[#1a1a1a]"
                                : "text-transparent"
                    }`}
                  >
                    {day || ""}
                  </div>
                  {hasEvents ? (
                    <div className="mt-0.5 flex gap-0.5">
                      {SCHEDULE_EVENTS[day!].slice(0, 3).map((ev, ei) => (
                        <div
                          key={ei}
                          className={`h-1.5 w-1.5 rounded-full ${
                            isSelected ? "bg-white" : ""
                          }`}
                          style={{
                            background: isSelected ? undefined : ev.color,
                          }}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mx-4 mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="m-0 text-base font-bold text-[#1a1a1a]">
              {month + 1}월 {selectedCalendarDay}일 일정
            </h2>
            <span className="text-[0.8125rem] text-[#999]">
              {selectedEvents.length}건
            </span>
          </div>
          {selectedEvents.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {selectedEvents.map((ev, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3.5 rounded-[14px] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                >
                  <div
                    className="h-11 w-1 shrink-0 rounded"
                    style={{ background: ev.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 text-[0.9375rem] font-bold text-[#1a1a1a]">
                      {displayEventTitle(ev)}
                      {googleCalendarConnected && ev.isPrivate ? (
                        <span className="ml-2 text-xs font-normal text-[#999]">
                          비공개
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[0.8125rem] text-[#888]">
                      🕐 {ev.time}
                    </div>
                  </div>
                  {googleCalendarConnected ? (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5]">
                      <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden>
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[14px] bg-white px-4 py-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <p className="m-0 text-[0.9375rem] font-medium text-[#bbb]">
                일정이 없습니다
              </p>
            </div>
          )}
        </div>

        <div className="mx-4 mb-4">
          <h2 className="mb-3 text-base font-bold text-[#1a1a1a]">
            이번 달 전체 일정
          </h2>
          <div className="flex flex-col gap-2">
            {Object.entries(SCHEDULE_EVENTS)
              .sort(([a], [b]) => Number(a) - Number(b))
              .flatMap(([day, events]) =>
                events.map((ev, ei) => (
                  <button
                    key={`${day}-${ei}`}
                    type="button"
                    onClick={() => onSelectedCalendarDayChange(Number(day))}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-none bg-white p-3 text-left shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                      style={{ background: `${ev.color}20` }}
                    >
                      <span
                        className="text-sm font-bold"
                        style={{ color: ev.color }}
                      >
                        {day}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-[#1a1a1a]">
                        {displayEventTitle(ev)}
                      </div>
                      <div className="mt-0.5 text-xs text-[#999]">
                        {month + 1}월 {day}일 · {ev.time}
                      </div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9 18l6-6-6-6"
                        stroke="#ccc"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )),
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
