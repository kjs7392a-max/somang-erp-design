"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { CalendarEvent } from "@/types/calendar";
import { CATEGORY_META } from "@/types/calendar";
import { usePersonalEvents } from "@/lib/calendar-data";
import { DayBottomSheet } from "@/components/calendar/DayBottomSheet";
import { EventFormSheet } from "@/components/calendar/EventFormSheet";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toISO(y: number, m: number, d: number) {
  const mm = String(m + 1).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

function isSameISO(a: string, b: string) {
  return a === b;
}

export function CalendarView() {
  const today = new Date();
  const [cursor, setCursor] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvt, setEditingEvt] = useState<CalendarEvent | null>(null);

  const { all, upsert, remove } = usePersonalEvents();

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());

  // 월 그리드 셀 생성
  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay(); // 0=일
    const lastDate = new Date(year, month + 1, 0).getDate();
    const arr: { iso: string; day: number; inMonth: boolean }[] = [];

    // 앞쪽 빈칸 (이전 달)
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      arr.push({
        iso: toISO(d.getFullYear(), d.getMonth(), d.getDate()),
        day: d.getDate(),
        inMonth: false,
      });
    }
    // 이번 달
    for (let d = 1; d <= lastDate; d++) {
      arr.push({ iso: toISO(year, month, d), day: d, inMonth: true });
    }
    // 뒤쪽 빈칸 (다음 달) - 6주 = 42칸 맞추기
    while (arr.length < 42) {
      const idx = arr.length - (firstDay + lastDate) + 1;
      const d = new Date(year, month + 1, idx);
      arr.push({
        iso: toISO(d.getFullYear(), d.getMonth(), d.getDate()),
        day: d.getDate(),
        inMonth: false,
      });
    }
    return arr;
  }, [year, month]);

  // 날짜별 일정 맵
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of all) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [all]);

  const goPrevMonth = () => setCursor(new Date(year, month - 1, 1));
  const goNextMonth = () => setCursor(new Date(year, month + 1, 1));
  const goToday = () => {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(todayISO);
  };

  const dayEvents = selectedDate ? (eventsByDate.get(selectedDate) ?? []) : [];

   return (
    <div className="relative flex min-h-[calc(100dvh-3.5rem)] flex-col pb-24">
      {/* 월 네비 */}
      <div className="sticky top-14 z-20 flex items-center justify-between bg-white px-4 py-3">
        <button
          type="button"
          onClick={goToday}
          className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-600 active:bg-zinc-50"
        >
          오늘
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 active:bg-zinc-100"
            aria-label="이전 달"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <h1 className="min-w-[110px] text-center text-[1.0625rem] font-bold text-zinc-900">
            {year}년 {month + 1}월
          </h1>
          <button
            type="button"
            onClick={goNextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 active:bg-zinc-100"
            aria-label="다음 달"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <div className="w-[44px]" />
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-t border-zinc-100 bg-white text-center text-[0.6875rem] font-semibold">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`py-1.5 ${
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-zinc-500"
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 월 그리드 */}
      <div className="grid grid-cols-7 border-t border-zinc-100 bg-white">
        {cells.map(({ iso, day, inMonth }, i) => {
          const isToday = iso === todayISO;
          const isSelected = selectedDate && isSameISO(iso, selectedDate);
          const evts = eventsByDate.get(iso) ?? [];
          const dayOfWeek = i % 7;

          return (
            <button
              key={iso + i}
              type="button"
              onClick={() => setSelectedDate(iso)}
    className={`flex min-h-[64px] flex-col items-center border-b border-r border-zinc-100 p-1 text-center ${
                (i + 1) % 7 === 0 ? "border-r-0" : ""
              } ${isSelected ? "bg-[#eef2ff]" : "active:bg-zinc-50"}`}
            >
              <span
                 className={`mb-0.5 mt-1 flex h-6 w-6 items-center justify-center text-[0.8125rem] font-semibold ${
                  isToday
                    ? "rounded-full bg-[#3b5bdb] text-white"
                    : !inMonth
                      ? "text-zinc-300"
                      : dayOfWeek === 0
                        ? "text-red-500"
                        : dayOfWeek === 6
                          ? "text-blue-500"
                          : "text-zinc-700"
                }`}
              >
                {day}
              </span>
               {/* 카테고리별 색점 (최대 5개 + 더보기) */}
              <div className="mt-auto flex flex-wrap items-center justify-center gap-0.5 pb-1">
                {evts.slice(0, 5).map((e) => {
                  const meta = CATEGORY_META[e.category];
                  return (
                    <span
                      key={e.id}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: meta.color }}
                    />
                  );
                })}
                {evts.length > 5 && (
                  <span className="text-[0.5625rem] font-semibold leading-none text-zinc-400">
                    +{evts.length - 5}
                  </span>
                )}
              </div>
            </button>
          );
        })}  
      </div>

      {/* 범례 */}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 px-5 pb-3 text-[0.6875rem]">
        {Object.entries(CATEGORY_META).map(([key, meta]) => (
          <span key={key} className="flex items-center gap-1 text-zinc-600">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: meta.color }}
            />
            {meta.label}
          </span>
        ))}
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => {
          setEditingEvt(null);
          setSelectedDate(selectedDate ?? todayISO);
          setFormOpen(true);
        }}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-[110] flex h-14 w-14 items-center justify-center rounded-full bg-[#3b5bdb] text-white shadow-[0_6px_16px_rgba(59,91,219,0.4)] active:scale-95"
        style={{ right: "max(1rem, calc(50vw - 215px + 1rem))" }}
        aria-label="일정 추가"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {/* 날짜 바텀시트 */}
      <DayBottomSheet
        open={!!selectedDate && !formOpen}
        onClose={() => setSelectedDate(null)}
        date={selectedDate ?? todayISO}
        events={dayEvents}
        onAdd={() => {
          setEditingEvt(null);
          setFormOpen(true);
        }}
        onEditPersonal={(evt) => {
          setEditingEvt(evt);
          setFormOpen(true);
        }}
      />

      {/* 폼 시트 */}
      <EventFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        defaultDate={selectedDate ?? todayISO}
        editing={editingEvt}
        onSave={(evt) => {
          upsert(evt);
          setFormOpen(false);
        }}
        onDelete={(id) => remove(id)}
      />
    </div>
  );
}