"use client";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  isToday,
} from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils/cn";
import { CATEGORY_CONFIG, type CalendarEvent } from "@/types/calendar";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface CalendarGridProps {
  year: number;
  month: number;
  events: CalendarEvent[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export default function CalendarGrid({
  year,
  month,
  events,
  selectedDate,
  onSelectDate,
}: CalendarGridProps) {
  const base = new Date(year, month, 1);
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(base), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(base), { weekStartsOn: 0 }),
  });

  const eventsOnDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.date), day));

  return (
    <div className="bg-white select-none">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={cn(
              "py-2 text-center text-xs font-medium",
              i === 0 ? "text-red-400" : i === 6 ? "text-[#2F80ED]" : "text-gray-400"
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayEvents = eventsOnDay(day);
          const isCurrentMonth = isSameMonth(day, base);
          const _isToday = isToday(day);
          const isSelected = isSameDay(day, selectedDate);
          const col = idx % 7;

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={cn(
                "relative flex flex-col items-center pt-1 pb-2 border-b border-gray-50 min-h-[64px]",
                !isCurrentMonth && "opacity-30"
              )}
            >
              {/* 날짜 숫자 */}
              <span
                className={cn(
                  "w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1",
                  isSelected
                    ? "bg-[#2F80ED] text-white"
                    : _isToday
                    ? "bg-blue-50 text-[#2F80ED] font-bold"
                    : col === 0
                    ? "text-red-400"
                    : col === 6
                    ? "text-[#2F80ED]"
                    : "text-gray-700"
                )}
              >
                {format(day, "d")}
              </span>

              {/* 이벤트 표시: 최대 2개 + 더보기 */}
              <div className="w-full px-0.5 space-y-0.5">
                {dayEvents.slice(0, 2).map((e) => (
                  <div
                    key={e.id}
                    className={cn(
                      "w-full rounded px-1 truncate text-[9px] font-medium leading-4",
                      CATEGORY_CONFIG[e.category].bg,
                      CATEGORY_CONFIG[e.category].color
                    )}
                  >
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <p className="text-[9px] text-gray-400 text-center leading-4">
                    +{dayEvents.length - 2}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
