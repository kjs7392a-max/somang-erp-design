"use client";

import { useState } from "react";
import {
  SHIFT_2026_04,
  SHIFT_CODE_META,
  type ShiftCode,
  type ShiftMember,
} from "@/lib/shift-data";
import { ShiftDayDetail } from "./ShiftDayDetail";
import { useT } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import type { TKey } from "@/lib/i18n/translations";

const DESC_KEYS: Record<ShiftCode, TKey> = {
  A:   "shift_desc_A",
  S:   "shift_desc_S",
  V:   "shift_desc_V",
  H:   "shift_desc_H",
  OFF: "shift_desc_OFF",
};

// April 1, 2026 = Wednesday = weekday index 3
function getWeekday(day: number, weekdays: string[]) {
  return weekdays[(3 + day - 1) % 7] ?? "";
}

export function ShiftTable() {
  const t = useT();
  const { profile } = useAuth();
  const TODAY_DAY = new Date().getDate();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const dept = profile?.department ?? "";
  const members: ShiftMember[] = SHIFT_2026_04;

  const me = members.find((m) => m.isMe) ?? members[0];
  const weekdays = t("cal_weekdays").split(",");

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = TODAY_DAY + i;
    if (day > 30) return null;
    return { day, code: me.row[day - 1] as ShiftCode, weekday: getWeekday(day, weekdays) };
  }).filter(Boolean) as { day: number; code: ShiftCode; weekday: string }[];

  const myCounts = me.row.reduce<Partial<Record<ShiftCode, number>>>((acc, c) => {
    acc[c] = (acc[c] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="pb-8">
      {/* 부서 카드 */}
      <div className="mx-4 mb-4 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(45,92,110,0.08)]">
        <div className="flex items-center gap-2">
          <span className="text-base">🏥</span>
          <div>
            <p className="text-[0.9375rem] font-bold text-zinc-900">소망병원 {dept || "총무과"}</p>
            <p className="text-xs text-zinc-500">
              {t("shift_member_count").replace("{n}", String(members.length))} · 2026년 4월
            </p>
          </div>
        </div>
      </div>

      {/* 내 이번 주 */}
      <div className="mx-4 mb-4 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(45,92,110,0.08)]">
        <p className="mb-3 text-sm font-bold text-zinc-700">{t("shift_my_week")}</p>
        <div className="flex gap-1.5">
          {weekDays.map(({ day, code, weekday }) => {
            const meta = SHIFT_CODE_META[code];
            const isToday = day === TODAY_DAY;
            const isSun = weekdays[0] === weekday;
            const isSat = weekdays[6] === weekday;
            return (
              <div
                key={day}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl p-1.5 ${
                  isToday ? "border-2 border-[#2d5c6e]" : "border border-zinc-100"
                }`}
              >
                <span className={`text-[0.625rem] font-semibold ${isSun ? "text-red-500" : isSat ? "text-blue-500" : "text-zinc-500"}`}>
                  {weekday}
                </span>
                <span className="text-xs font-bold text-zinc-700">{day}</span>
                <span className="rounded px-1 py-0.5 text-[0.5625rem] font-bold" style={{ background: meta.bg, color: meta.fg }}>
                  {code}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 전체 그리드 */}
      <div className="overflow-x-auto px-4">
        <div className="min-w-max">
          {/* 날짜 헤더 */}
          <div className="flex">
            <div className="w-14 shrink-0" />
            {Array.from({ length: 30 }, (_, i) => {
              const day = i + 1;
              const wd = getWeekday(day, weekdays);
              const isToday = day === TODAY_DAY;
              const isSun = weekdays[0] === wd;
              const isSat = weekdays[6] === wd;
              return (
                <div
                  key={day}
                  className={`flex w-8 shrink-0 flex-col items-center pb-1 ${isToday ? "border-b-2 border-[#2d5c6e]" : ""}`}
                >
                  <span className={`text-[0.5rem] font-semibold ${isSun ? "text-red-400" : isSat ? "text-blue-400" : "text-zinc-400"}`}>
                    {wd}
                  </span>
                  <span className={`text-[0.625rem] font-bold ${isToday ? "text-[#2d5c6e]" : "text-zinc-600"}`}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 멤버 행 */}
          {members.map((member) => (
            <div key={member.id} className={`flex items-center ${member.isMe ? "bg-[rgba(45,92,110,0.04)]" : ""}`}>
              <div className="relative flex w-14 shrink-0 flex-col justify-center py-1 pr-1">
                {member.isMe && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-[#2d5c6e]" />
                )}
                <span className={`pl-2 text-[0.6875rem] font-bold leading-tight ${member.isMe ? "text-[#2d5c6e]" : "text-zinc-700"}`}>
                  {member.name}
                </span>
                <span className="pl-2 text-[0.5625rem] leading-tight text-zinc-400">{member.role}</span>
              </div>
              {member.row.map((code, dayIdx) => {
                const meta = SHIFT_CODE_META[code];
                const isToday = dayIdx + 1 === TODAY_DAY;
                return (
                  <button
                    key={dayIdx}
                    type="button"
                    onClick={() => setSelectedDay(dayIdx + 1)}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center text-[0.625rem] font-bold ${
                      isToday ? "border-b-2 border-[#2d5c6e]" : ""
                    }`}
                    style={{ background: meta.bg, color: meta.fg }}
                  >
                    {code}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 범례 */}
      <div className="mx-4 mt-4 flex flex-wrap gap-2">
        {(Object.entries(SHIFT_CODE_META) as [ShiftCode, typeof SHIFT_CODE_META[ShiftCode]][]).map(
          ([code, meta]) => (
            <span
              key={code}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ background: meta.bg, color: meta.fg }}
            >
              {code} {t(DESC_KEYS[code])}
            </span>
          ),
        )}
      </div>

      {/* 통계 */}
      <div className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(45,92,110,0.08)]">
        <p className="mb-3 text-sm font-bold text-zinc-700">
          {t("shift_stats_title").replace("{month}", "4")}
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(myCounts) as [ShiftCode, number][]).map(([code, count]) => {
            const meta = SHIFT_CODE_META[code];
            return (
              <span key={code} className="rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ background: meta.bg, color: meta.fg }}>
                {code} = {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* 안내 */}
      <div className="mx-4 mt-4 rounded-xl bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-500">
        {t("shift_guidance")}
      </div>

      {selectedDay !== null && (
        <ShiftDayDetail
          day={selectedDay}
          onClose={() => setSelectedDay(null)}
          members={members}
        />
      )}
    </div>
  );
}
