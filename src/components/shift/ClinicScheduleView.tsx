"use client";

import { CATEGORY_META } from "@/types/calendar";
import { MOCK_EVENTS } from "@/lib/calendar-data";

type SlotMeta = { color: string; bg: string; label: string };

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekDays(today: Date) {
  const day = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

export function ClinicScheduleView() {
  const today = new Date();
  const todayISO = toISO(today);
  const weekDays = getWeekDays(today);

  const weekStart = toISO(weekDays[0]);
  const weekEnd   = toISO(weekDays[6]);

  const weekEvents = MOCK_EVENTS.filter(
    (e) => e.date >= weekStart && e.date <= weekEnd,
  );

  const byDate = new Map<string, typeof weekEvents>();
  for (const e of weekEvents) {
    const list = byDate.get(e.date) ?? [];
    list.push(e);
    byDate.set(e.date, list);
  }

  const monthLabel = `${today.getFullYear()}년 ${today.getMonth() + 1}월`;
  const rangeLabel = `${weekDays[0].getMonth() + 1}/${weekDays[0].getDate()} – ${weekDays[6].getMonth() + 1}/${weekDays[6].getDate()}`;

  // 이번 달 외래/회진 총 횟수
  const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const monthEvents = MOCK_EVENTS.filter((e) => e.date.startsWith(thisMonth));
  const outerCount  = monthEvents.filter((e) => e.title === "외래 진료").length;
  const roundCount  = monthEvents.filter((e) => e.title === "회진").length;

  return (
    <div className="pb-8">
      {/* 헤더 카드 */}
      <div className="mx-4 mb-4 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(45,92,110,0.08)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🏥</span>
            <div>
              <p className="text-[0.9375rem] font-bold text-zinc-900">이강표 이사장 진료 스케줄</p>
              <p className="text-xs text-zinc-500">정신건강의학과 · {monthLabel}</p>
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-3">
          <div className="flex-1 rounded-xl bg-[#ffe3e3] px-3 py-2 text-center">
            <p className="text-[0.625rem] font-semibold text-[#c92a2a]">외래 진료</p>
            <p className="text-lg font-bold text-[#c92a2a]">{outerCount}회</p>
          </div>
          <div className="flex-1 rounded-xl bg-[#e8f4ff] px-3 py-2 text-center">
            <p className="text-[0.625rem] font-semibold text-[#1d6fa5]">회진</p>
            <p className="text-lg font-bold text-[#1d6fa5]">{roundCount}회</p>
          </div>
          <div className="flex-1 rounded-xl bg-[#d3f9d8] px-3 py-2 text-center">
            <p className="text-[0.625rem] font-semibold text-[#2f9e44]">회의</p>
            <p className="text-lg font-bold text-[#2f9e44]">
              {monthEvents.filter((e) => e.category === "meeting").length}회
            </p>
          </div>
        </div>
      </div>

      {/* 이번 주 */}
      <div className="mx-4 mb-2 flex items-center justify-between">
        <p className="text-sm font-bold text-zinc-700">이번 주 일정</p>
        <p className="text-xs text-zinc-400">{rangeLabel}</p>
      </div>

      <div className="mx-4 space-y-2">
        {weekDays.map((d) => {
          const iso = toISO(d);
          const isToday = iso === todayISO;
          const dayOfWeek = d.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const events = byDate.get(iso) ?? [];

          return (
            <div
              key={iso}
              className={`rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(45,92,110,0.08)] ${
                isToday ? "border-2 border-[#2d5c6e]" : ""
              }`}
            >
              {/* 날짜 행 */}
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    isToday
                      ? "bg-[#2d5c6e] text-white"
                      : dayOfWeek === 0
                        ? "bg-red-50 text-red-500"
                        : dayOfWeek === 6
                          ? "bg-blue-50 text-blue-500"
                          : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {d.getDate()}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    dayOfWeek === 0
                      ? "text-red-500"
                      : dayOfWeek === 6
                        ? "text-blue-500"
                        : "text-zinc-500"
                  }`}
                >
                  {WEEKDAY_KO[dayOfWeek]}요일
                </span>
                {isToday && (
                  <span className="rounded-full bg-[#eef8f5] px-2 py-0.5 text-[0.625rem] font-bold text-[#2d5c6e]">
                    오늘
                  </span>
                )}
              </div>

              {/* 일정 슬롯 */}
              {events.length === 0 ? (
                <p className="text-xs text-zinc-300">{isWeekend ? "휴무" : "일정 없음"}</p>
              ) : (
                <div className="space-y-1.5">
                  {events.map((e) => {
                    const meta: SlotMeta = CATEGORY_META[e.category];
                    return (
                      <div
                        key={e.id}
                        className="flex items-center gap-2 rounded-xl px-3 py-2"
                        style={{ background: meta.bg }}
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: meta.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: meta.color }}>
                            {e.title}
                          </p>
                          {(e.startTime || e.location) && (
                            <p className="text-[0.625rem] text-zinc-400">
                              {e.startTime && `${e.startTime}${e.endTime ? `–${e.endTime}` : ""}`}
                              {e.startTime && e.location && " · "}
                              {e.location}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="mx-4 mt-4 flex flex-wrap gap-2">
        {(["shift", "meeting", "training", "event"] as const).map((cat) => {
          const meta = CATEGORY_META[cat];
          return (
            <span
              key={cat}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ background: meta.bg, color: meta.color }}
            >
              {meta.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
