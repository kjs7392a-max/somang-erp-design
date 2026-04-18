"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, ChevronDown, ChevronUp, X, Lock, Globe } from "lucide-react";

export type ScheduleEventItem = {
  id: number;
  title: string;
  date: string;
  time?: string;
  isAllDay?: boolean;
  isPrivate?: boolean;
  color: string;
  category: "personal" | "department" | "company";
};

export type CalendarViewProps = {
  scheduleCurrentDate: Date;
  onScheduleCurrentDateChange: (d: Date) => void;
  selectedCalendarDay: number;
  onSelectedCalendarDayChange: (day: number) => void;
  googleCalendarConnected: boolean;
  onGoogleCalendarConnectedChange: (v: boolean) => void;
};

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

const CATEGORY_CONFIG = {
  personal:   { label: "내 일정",   color: "#3b5bdb", bg: "#3b5bdb18", dot: "#3b5bdb" },
  department: { label: "부서 일정", color: "#10b981", bg: "#10b98118", dot: "#10b981" },
  company:    { label: "전사 일정", color: "#f59e0b", bg: "#f59e0b18", dot: "#f59e0b" },
};

const ALL_CATEGORIES = ["personal", "department", "company"] as const;
type Category = typeof ALL_CATEGORIES[number];

const INITIAL_EVENTS: ScheduleEventItem[] = [
  { id: 1,  title: "부서 정기 회의",  date: "2026-04-04", time: "09:00", color: "#3b5bdb", category: "department" },
  { id: 2,  title: "외부 미팅",       date: "2026-04-07", time: "14:00", color: "#f59e0b", category: "personal" },
  { id: 3,  title: "건강검진",         date: "2026-04-10", isAllDay: true, color: "#10b981", category: "personal" },
  { id: 4,  title: "교육 연수",        date: "2026-04-15", time: "15:00", color: "#3b5bdb", category: "department" },
  { id: 5,  title: "팀장급 회의",      date: "2026-04-18", time: "11:00", color: "#3b5bdb", category: "department" },
  { id: 6,  title: "클라이언트 미팅",  date: "2026-04-18", time: "14:30", color: "#ef4444", category: "personal" },
  { id: 7,  title: "병원 예약",        date: "2026-04-18", time: "16:00", isPrivate: true, color: "#9ca3af", category: "personal" },
  { id: 8,  title: "프로젝트 발표",    date: "2026-04-20", time: "10:00", color: "#ef4444", category: "department" },
  { id: 9,  title: "신입사원 OJT",    date: "2026-04-22", isAllDay: true, color: "#f59e0b", category: "company" },
  { id: 10, title: "상반기 성과보고",  date: "2026-04-25", time: "14:00", color: "#3b5bdb", category: "company" },
  { id: 11, title: "분기 경영 보고",  date: "2026-04-28", time: "16:00", color: "#3b5bdb", category: "company" },
];

function isSameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function toDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function AddEventForm({ defaultDate, onClose, onSave }: {
  defaultDate: string;
  onClose: () => void;
  onSave: (event: Omit<ScheduleEventItem, "id">) => void;
}) {
  const [title, setTitle]         = useState("");
  const [date, setDate]           = useState(defaultDate);
  const [time, setTime]           = useState("09:00");
  const [isAllDay, setIsAllDay]   = useState(false);
  const [category, setCategory]   = useState<Category>("personal");
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      date,
      time: isAllDay ? undefined : time,
      isAllDay: isAllDay || undefined,
      isPrivate: category === "personal" ? isPrivate : undefined,
      color: CATEGORY_CONFIG[category].color,
      category,
    });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <button onClick={onClose} className="p-1 text-gray-400">
            <X size={20} />
          </button>
          <h2 className="text-sm font-bold text-gray-900">일정 추가</h2>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="text-sm font-semibold text-[#3b5bdb] disabled:text-gray-300 transition-colors"
          >
            저장
          </button>
        </div>

        <div className="px-5 py-4 space-y-5 overflow-y-auto max-h-[70vh] pb-10">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full text-base font-medium text-gray-900 placeholder:text-gray-300 border-b-2 border-gray-100 pb-2 outline-none focus:border-[#3b5bdb] transition-colors"
            autoFocus
          />

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">날짜</span>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="text-sm text-gray-900 font-medium outline-none border border-gray-200 rounded-lg px-2.5 py-1.5"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">하루 종일</span>
            <button
              onClick={() => setIsAllDay(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isAllDay ? "bg-[#3b5bdb]" : "bg-gray-200"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isAllDay ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          {!isAllDay && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">시간</span>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="text-sm text-gray-900 font-medium outline-none border border-gray-200 rounded-lg px-2.5 py-1.5"
              />
            </div>
          )}

          <div>
            <span className="text-sm text-gray-500 block mb-2.5">카테고리</span>
            <div className="flex gap-2">
              {ALL_CATEGORIES.map(cat => {
                const cfg = CATEGORY_CONFIG[cat];
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-all"
                    style={active
                      ? { borderColor: cfg.color, background: cfg.bg, color: cfg.color }
                      : { borderColor: "#e5e7eb", background: "white", color: "#9ca3af" }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: active ? cfg.dot : "#d1d5db" }} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {category === "personal" && (
            <div>
              <span className="text-sm text-gray-500 block mb-2.5">공개 여부</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsPrivate(false)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all
                    ${!isPrivate ? "border-[#3b5bdb] bg-[#3b5bdb18] text-[#3b5bdb]" : "border-gray-200 bg-white text-gray-400"}`}
                >
                  <Globe size={15} /> 공개
                </button>
                <button
                  onClick={() => setIsPrivate(true)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all
                    ${isPrivate ? "border-gray-500 bg-gray-100 text-gray-700" : "border-gray-200 bg-white text-gray-400"}`}
                >
                  <Lock size={15} /> 비공개
                </button>
              </div>
              {isPrivate && (
                <p className="mt-2 text-[11px] text-gray-400 flex items-center gap-1">
                  <Lock size={10} /> 나만 볼 수 있는 일정입니다
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function CalendarView({
  scheduleCurrentDate,
  onScheduleCurrentDateChange,
  selectedCalendarDay,
  onSelectedCalendarDayChange,
}: CalendarViewProps) {
  const [events, setEvents]               = useState<ScheduleEventItem[]>(INITIAL_EVENTS);
  const [activeFilters, setActiveFilters] = useState<Category[]>([...ALL_CATEGORIES]);
  const [showEventList, setShowEventList] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEventItem | null>(null);
  const [showAddForm, setShowAddForm]     = useState(false);

  const today = new Date();
  const year  = scheduleCurrentDate.getFullYear();
  const month = scheduleCurrentDate.getMonth();

  const prevMonth = () => onScheduleCurrentDateChange(new Date(year, month - 1, 1));
  const nextMonth = () => onScheduleCurrentDateChange(new Date(year, month + 1, 1));
  const goToday   = () => {
    onScheduleCurrentDateChange(new Date(today.getFullYear(), today.getMonth(), 1));
    onSelectedCalendarDayChange(today.getDate());
  };

  const selectedDate = new Date(year, month, selectedCalendarDay);

  const toggleFilter = (cat: Category) =>
    setActiveFilters(prev =>
      prev.includes(cat)
        ? prev.length === 1 ? prev : prev.filter(c => c !== cat)
        : [...prev, cat]
    );

  const filteredEvents = useMemo(
    () => events.filter(e => activeFilters.includes(e.category)),
    [events, activeFilters]
  );

  const eventsOnDay = (d: Date) =>
    filteredEvents.filter(e => isSameDate(new Date(e.date), d));

  const selectedDayEvents = useMemo(
    () => eventsOnDay(selectedDate),
    [filteredEvents, selectedDate]
  );

  const monthEvents = useMemo(
    () => filteredEvents
      .filter(e => { const d = new Date(e.date); return d.getFullYear() === year && d.getMonth() === month; })
      .sort((a, b) => a.date.localeCompare(b.date)),
    [filteredEvents, year, month]
  );

  const firstDow    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const selectedWeekIdx = weeks.findIndex(w => w.some(d => d && isSameDate(d, selectedDate)));
  const selectedColIdx  = selectedWeekIdx >= 0
    ? weeks[selectedWeekIdx].findIndex(d => d && isSameDate(d, selectedDate))
    : -1;

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">

      {/* 월 네비게이션 + 일정 추가 버튼 */}
      <div className="bg-white px-4 py-2.5 flex items-center gap-2 border-b border-gray-100">
        <button
          onClick={goToday}
          className="text-xs text-[#3b5bdb] font-medium border border-[#3b5bdb] rounded-md px-2.5 py-1.5 shrink-0"
        >
          오늘
        </button>

        <div className="flex-1 flex items-center justify-center gap-2">
          <button onClick={prevMonth} className="p-1 text-gray-400">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold text-gray-800 w-24 text-center">
            {year}년 {month + 1}월
          </span>
          <button onClick={nextMonth} className="p-1 text-gray-400">
            <ChevronRight size={18} />
          </button>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1 bg-[#3b5bdb] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0"
        >
          <Plus size={13} /> 추가
        </button>
      </div>

      {/* 필터 탭 */}
      <div className="bg-white px-4 py-2 flex gap-2 border-b border-gray-100 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {ALL_CATEGORIES.map(cat => {
          const cfg = CATEGORY_CONFIG[cat];
          const active = activeFilters.includes(cat);
          return (
            <button
              key={cat}
              onClick={() => toggleFilter(cat)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-colors shrink-0"
              style={active
                ? { background: cfg.bg, color: cfg.color, borderColor: "transparent" }
                : { background: "white", color: "#9ca3af", borderColor: "#e5e7eb" }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: active ? cfg.dot : "#d1d5db" }} />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* 캘린더 그리드 */}
      <div className="bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {DAY_NAMES.map((d, i) => (
            <div
              key={d}
              className={`py-2 text-center text-xs font-medium border-r border-gray-100 last:border-r-0
                ${i === 0 ? "text-red-400" : i === 6 ? "text-[#3b5bdb]" : "text-gray-400"}`}
            >
              {d}
            </div>
          ))}
        </div>

        <div>
          {weeks.map((week, wIdx) => {
            const isSelectedWeek = wIdx === selectedWeekIdx;
            return (
              <div key={wIdx}>
                <div className="grid grid-cols-7 border-b border-gray-100">
                  {week.map((day, dIdx) => {
                    if (!day) return (
                      <div key={dIdx} className="min-h-[60px] border-r border-gray-100 last:border-r-0 bg-gray-50/50" />
                    );
                    const dayEvs     = eventsOnDay(day);
                    const _isToday   = isSameDate(day, today);
                    const isSelected = isSameDate(day, selectedDate);
                    return (
                      <button
                        key={dIdx}
                        onClick={() => {
                          onSelectedCalendarDayChange(day.getDate());
                          if (day.getMonth() !== month)
                            onScheduleCurrentDateChange(new Date(day.getFullYear(), day.getMonth(), 1));
                        }}
                        className="flex flex-col items-center pt-1 pb-1.5 border-r border-gray-100 last:border-r-0 min-h-[60px]"
                      >
                        <span
                          className={`w-7 h-7 flex items-center justify-center rounded-full text-[13px] font-medium mb-0.5
                            ${isSelected ? "bg-[#3b5bdb] text-white"
                              : _isToday  ? "bg-blue-50 text-[#3b5bdb] font-bold"
                              : dIdx === 0 ? "text-red-400"
                              : dIdx === 6 ? "text-[#3b5bdb]"
                              : "text-gray-700"}`}
                        >
                          {day.getDate()}
                        </span>
                        <div className="w-full px-0.5 space-y-0.5">
                          {dayEvs.slice(0, 2).map(e => (
                            <div
                              key={e.id}
                              className="w-full rounded px-1 truncate text-[9px] font-medium leading-4"
                              style={{ background: CATEGORY_CONFIG[e.category].bg, color: CATEGORY_CONFIG[e.category].color }}
                            >
                              {e.isPrivate ? "🔒 비공개" : e.title}
                            </div>
                          ))}
                          {dayEvs.length > 2 && (
                            <p className="text-[9px] text-gray-400 text-center leading-4">+{dayEvs.length - 2}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {isSelectedWeek && selectedDayEvents.length > 0 && (
                  <div className="relative border-b border-gray-100 bg-gray-50 px-3 py-3">
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
                      className="absolute -top-[7px] w-0 h-0"
                      style={{
                        left: `calc(${(selectedColIdx + 0.5) / 7 * 100}% - 7px)`,
                        borderLeft: "7px solid transparent",
                        borderRight: "7px solid transparent",
                        borderBottom: "7px solid #f9fafb",
                      }}
                    />
                    <p className="text-[10px] font-semibold text-gray-400 mb-1.5 ml-1">
                      {month + 1}/{selectedCalendarDay} 일정
                    </p>
                    <div className="space-y-1">
                      {selectedDayEvents.map(e => (
                        <button
                          key={e.id}
                          onClick={() => setSelectedEvent(e)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left"
                          style={{ background: CATEGORY_CONFIG[e.category].bg }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: CATEGORY_CONFIG[e.category].dot }} />
                          <span className="text-xs font-medium truncate flex-1" style={{ color: CATEGORY_CONFIG[e.category].color }}>
                            {e.isPrivate ? "🔒 비공개 일정" : e.title}
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {e.isAllDay ? "종일" : e.time ?? ""}
                          </span>
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

      {/* 전체 월 일정 토글 */}
      <button
        onClick={() => setShowEventList(v => !v)}
        className="flex items-center justify-between w-full px-4 py-3 bg-white border-t border-b border-gray-200 mt-2"
      >
        <span className="text-sm font-semibold text-gray-700">
          {year}년 {month + 1}월 전체 일정
          <span className="ml-2 text-xs font-normal text-gray-400">{monthEvents.length}건</span>
        </span>
        {showEventList ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {showEventList && (
        <div className="px-4 py-3 pb-32 space-y-2">
          {monthEvents.map(e => (
            <button
              key={e.id}
              onClick={() => setSelectedEvent(e)}
              className="w-full flex items-start gap-3 bg-white rounded-xl px-4 py-3 shadow-sm text-left"
            >
              <div className="w-1 self-stretch rounded-full shrink-0 mt-0.5" style={{ background: CATEGORY_CONFIG[e.category].color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-1">
                  {e.isPrivate && <Lock size={11} className="text-gray-400 shrink-0" />}
                  {e.isPrivate ? "비공개 일정" : e.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(e.date).getDate()}일
                  {e.isAllDay ? " · 하루 종일" : e.time ? ` · ${e.time}` : ""}
                </p>
              </div>
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                style={{ background: CATEGORY_CONFIG[e.category].bg, color: CATEGORY_CONFIG[e.category].color }}
              >
                {CATEGORY_CONFIG[e.category].label}
              </span>
            </button>
          ))}
          {monthEvents.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">이달 일정이 없습니다.</p>
          )}
        </div>
      )}
      {!showEventList && <div className="pb-24" />}

      {/* 일정 상세 바텀시트 */}
      {selectedEvent && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSelectedEvent(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl px-5 pt-4 pb-10">
            <div className="flex justify-center mb-3">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: CATEGORY_CONFIG[selectedEvent.category].color }} />
                <h2 className="text-base font-bold text-gray-900 truncate">
                  {selectedEvent.isPrivate ? "비공개 일정" : selectedEvent.title}
                </h2>
                {selectedEvent.isPrivate && (
                  <span className="flex items-center gap-0.5 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">
                    <Lock size={9} /> 비공개
                  </span>
                )}
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-1 text-gray-400 ml-2">
                <X size={18} />
              </button>
            </div>
            <span
              className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full mb-4"
              style={{ background: CATEGORY_CONFIG[selectedEvent.category].bg, color: CATEGORY_CONFIG[selectedEvent.category].color }}
            >
              {CATEGORY_CONFIG[selectedEvent.category].label}
            </span>
            <div className="text-sm text-gray-600 space-y-2">
              <p>📅 {selectedEvent.date}</p>
              <p>🕐 {selectedEvent.isAllDay ? "하루 종일" : selectedEvent.time ?? "-"}</p>
              {selectedEvent.isPrivate && (
                <p className="flex items-center gap-1 text-gray-400">
                  <Lock size={13} /> 나만 볼 수 있는 일정
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {showAddForm && (
        <AddEventForm
          defaultDate={toDateString(selectedDate)}
          onClose={() => setShowAddForm(false)}
          onSave={ev => setEvents(prev => [...prev, { ...ev, id: Date.now() }])}
        />
      )}
    </div>
  );
}
