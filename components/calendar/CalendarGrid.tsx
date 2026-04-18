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
import { cn } from "@/lib/utils/cn";
import { CATEGORY_CONFIG, type CalendarEvent } from "@/types/calendar";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface CalendarGridProps {
  year: number;
  month: number;
  events: CalendarEvent[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export default function CalendarGrid({
  year,
  month,
  events,
  selectedDate,
  onSelectDate,
  onEventClick,
}: CalendarGridProps) {
  const base = new Date(year, month, 1);
  const allDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(base), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(base), { weekStartsOn: 0 }),
  });

  // 주 단위로 분리
  const weeks: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  const eventsOnDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.date), day));

  // 선택된 날짜가 몇 번째 주, 몇 번째 열인지
  const selectedWeekIdx = weeks.findIndex((week) =>
    week.some((d) => isSameDay(d, selectedDate))
  );
  const selectedColIdx =
    selectedWeekIdx >= 0
      ? weeks[selectedWeekIdx].findIndex((d) => isSameDay(d, selectedDate))
      : -1;

  const bubbleEvents = eventsOnDay(selectedDate);

  return (
    <div className="bg-white select-none">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={cn(
              "py-2 text-center text-xs font-medium border-r border-gray-200 last:border-r-0",
              i === 0 ? "text-red-400" : i === 6 ? "text-[#2F80ED]" : "text-gray-400"
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 (주 단위) */}
      <div className="border-l border-gray-200">
        {weeks.map((week, wIdx) => {
          const isSelectedWeek = wIdx === selectedWeekIdx;

          return (
            <div key={wIdx}>
              {/* 날짜 셀 행 */}
              <div className="grid grid-cols-7">
                {week.map((day, dIdx) => {
                  const dayEvents = eventsOnDay(day);
                  const isCurrentMonth = isSameMonth(day, base);
                  const _isToday = isToday(day);
                  const isSelected = isSameDay(day, selectedDate);
                  const col = dIdx;

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => onSelectDate(day)}
                      className={cn(
                        "relative flex flex-col items-center pt-1 pb-2 border-b border-r border-gray-200 min-h-[64px]",
                        !isCurrentMonth && "opacity-30"
                      )}
                    >
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

              {/* 말풍선: 선택된 주 아래에만 표시 */}
              {isSelectedWeek && bubbleEvents.length > 0 && (
                <div className="relative border-b border-gray-200 bg-gray-50 px-3 py-3">
                  {/* 삼각형 포인터 */}
                  <div
                    className="absolute -top-2 w-0 h-0"
                    style={{
                      left: `calc(${(selectedColIdx + 0.5) / 7 * 100}% - 8px)`,
                      borderLeft: "8px solid transparent",
                      borderRight: "8px solid transparent",
                      borderBottom: "8px solid #e5e7eb",
                    }}
                  />
                  <div
                    className="absolute -top-1.5 w-0 h-0"
                    style={{
                      left: `calc(${(selectedColIdx + 0.5) / 7 * 100}% - 7px)`,
                      borderLeft: "7px solid transparent",
                      borderRight: "7px solid transparent",
                      borderBottom: "7px solid #f9fafb",
                    }}
                  />

                  {/* 일정 목록 */}
                  <p className="text-[10px] font-semibold text-gray-400 mb-1.5 ml-1">
                    {format(selectedDate, "M/d")} 일정
                  </p>
                  <div className="space-y-1">
                    {bubbleEvents.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => onEventClick(e)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left",
                          CATEGORY_CONFIG[e.category].bg
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", CATEGORY_CONFIG[e.category].dot)} />
                        <span className={cn("text-xs font-medium truncate flex-1", CATEGORY_CONFIG[e.category].color)}>
                          {e.title}
                        </span>
                        {(e.startTime || e.isAllDay) && (
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {e.isAllDay ? "종일" : e.startTime}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
