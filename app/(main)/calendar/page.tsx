"use client";

import { useState, useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import CalendarEventItem from "@/components/calendar/CalendarEventItem";
import CalendarBottomSheet from "@/components/calendar/CalendarBottomSheet";
import { CATEGORY_CONFIG, type CalendarEvent, type EventCategory } from "@/types/calendar";
import { DUMMY_EVENTS } from "@/lib/data/calendarEvents";
import { cn } from "@/lib/utils/cn";

const ALL_CATEGORIES: EventCategory[] = ["personal", "department", "company"];

export default function CalendarPage() {
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [activeFilters, setActiveFilters] = useState<EventCategory[]>([...ALL_CATEGORIES]);
  const [showEventList, setShowEventList] = useState(false); // 기본 숨김

  const toggleFilter = (cat: EventCategory) => {
    setActiveFilters((prev) =>
      prev.includes(cat)
        ? prev.length === 1 ? prev : prev.filter((c) => c !== cat)
        : [...prev, cat]
    );
  };

  const goToToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDate(today);
  };

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const filteredEvents = useMemo(
    () => DUMMY_EVENTS.filter((e) => activeFilters.includes(e.category)),
    [activeFilters]
  );

  const selectedDayEvents = useMemo(
    () => filteredEvents.filter((e) => isSameDay(new Date(e.date), selectedDate)),
    [filteredEvents, selectedDate]
  );

  const totalMonthEvents = useMemo(
    () => filteredEvents.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length,
    [filteredEvents, year, month]
  );

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <AppHeader
        title="일정"
        right={
          <button className="flex items-center gap-1 bg-[#2F80ED] text-white text-xs font-medium px-3 py-1.5 rounded-lg">
            <Plus size={14} />일정 추가
          </button>
        }
      />

      {/* 월 헤더 */}
      <CalendarHeader
        year={year}
        month={month}
        onPrev={prevMonth}
        onNext={nextMonth}
        onToday={goToToday}
      />

      {/* 필터 탭 */}
      <div className="flex gap-2 px-4 py-2 bg-white border-b border-gray-100 overflow-x-auto scrollbar-none">
        {ALL_CATEGORIES.map((cat) => {
          const cfg = CATEGORY_CONFIG[cat];
          const active = activeFilters.includes(cat);
          return (
            <button
              key={cat}
              onClick={() => toggleFilter(cat)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-colors",
                active
                  ? `${cfg.bg} ${cfg.color} border-transparent`
                  : "bg-white text-gray-400 border-gray-200"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", active ? cfg.dot : "bg-gray-300")} />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* 캘린더 그리드 */}
      <div className="bg-white shadow-sm">
        <CalendarGrid
          year={year}
          month={month}
          events={filteredEvents}
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            setSelectedDate(date);
            if (date.getMonth() !== month) {
              setYear(date.getFullYear());
              setMonth(date.getMonth());
            }
          }}
          onEventClick={(event) => setSelectedEvent(event)}
        />
      </div>

      {/* 전체 일정 토글 버튼 */}
      <button
        onClick={() => setShowEventList((v) => !v)}
        className="flex items-center justify-between w-full px-4 py-3 bg-white border-t border-b border-gray-200 mt-2"
      >
        <span className="text-sm font-semibold text-gray-700">
          {year}년 {month + 1}월 전체 일정
          <span className="ml-2 text-xs font-normal text-gray-400">{totalMonthEvents}건</span>
        </span>
        {showEventList
          ? <ChevronUp size={16} className="text-gray-400" />
          : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {/* 전체 일정 목록 (토글) */}
      {showEventList && (
        <div className="px-4 py-3 pb-24 space-y-2">
          {filteredEvents
            .filter((e) => {
              const d = new Date(e.date);
              return d.getFullYear() === year && d.getMonth() === month;
            })
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((event) => (
              <CalendarEventItem
                key={event.id}
                event={event}
                onClick={() => setSelectedEvent(event)}
              />
            ))}
          {totalMonthEvents === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">이달 일정이 없습니다.</p>
          )}
        </div>
      )}

      {!showEventList && <div className="pb-20" />}

      {/* 상세 바텀 시트 */}
      <CalendarBottomSheet
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
