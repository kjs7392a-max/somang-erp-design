"use client";

import { useState } from "react";
import AppHeader from "@/components/layout/AppHeader";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const schedules = [
  { date: "2026-04-18", title: "팀장 회의", time: "10:00", color: "bg-[#2F80ED]" },
  { date: "2026-04-18", title: "신입사원 OJT", time: "14:00", color: "bg-green-500" },
  { date: "2026-04-22", title: "이사회", time: "09:00", color: "bg-purple-500" },
  { date: "2026-04-25", title: "월간 보고", time: "15:00", color: "bg-orange-400" },
  { date: "2026-04-30", title: "예산 마감", time: "18:00", color: "bg-red-500" },
];

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  );

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const formatDate = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const hasSchedule = (day: number) =>
    schedules.some((s) => s.date === formatDate(day));

  const selectedSchedules = schedules.filter((s) => s.date === selectedDate);

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <AppHeader title="일정" />

      <main className="flex-1 pb-20">
        <div className="bg-white px-4 pt-4 pb-2">
          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1 text-gray-500">
              <ChevronLeft size={20} />
            </button>
            <span className="text-base font-semibold text-gray-900">
              {year}년 {month + 1}월
            </span>
            <button onClick={nextMonth} className="p-1 text-gray-500">
              <ChevronRight size={20} />
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d, i) => (
              <div
                key={d}
                className={cn(
                  "text-center text-xs font-medium py-1",
                  i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"
                )}
              >
                {d}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((day, idx) => {
              if (!day) return <div key={idx} />;
              const dateStr = formatDate(day);
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();
              const isSelected = dateStr === selectedDate;
              const hasSched = hasSchedule(day);
              const col = idx % 7;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(dateStr)}
                  className="flex flex-col items-center py-1 gap-0.5"
                >
                  <span
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-full text-sm",
                      isSelected
                        ? "bg-[#2F80ED] text-white font-semibold"
                        : isToday
                        ? "bg-blue-50 text-[#2F80ED] font-semibold"
                        : col === 0
                        ? "text-red-400"
                        : col === 6
                        ? "text-blue-400"
                        : "text-gray-700"
                    )}
                  >
                    {day}
                  </span>
                  {hasSched && (
                    <span className="w-1 h-1 rounded-full bg-[#2F80ED]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 선택된 날의 일정 */}
        <div className="px-4 py-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">{selectedDate} 일정</p>
          {selectedSchedules.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">등록된 일정이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {selectedSchedules.map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
                  <span className={cn("w-2 h-10 rounded-full shrink-0", s.color)} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.title}</p>
                    <p className="text-xs text-gray-400">{s.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
