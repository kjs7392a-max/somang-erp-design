"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, ChevronDown } from "lucide-react";

export type ScheduleEventItem = {
  title: string;
  time: string;
  color: string;
  isPrivate?: boolean;
  category?: "personal" | "department" | "company";
};

export type CalendarViewProps = {
  scheduleCurrentDate: Date;
  onScheduleCurrentDateChange: (d: Date) => void;
  selectedCalendarDay: number;
  onSelectedCalendarDayChange: (day: number) => void;
  googleCalendarConnected: boolean;
  onGoogleCalendarConnectedChange: (v: boolean) => void;
};

const MONTH_NAMES = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const DAY_NAMES = ["일","월","화","수","목","금","토"];

const SCHEDULE_EVENTS: Record<number, ScheduleEventItem[]> = {
  4:  [{ title: "부서 정기 회의", time: "09:00", color: "#3b5bdb", category: "department" }],
  7:  [{ title: "외부 미팅", time: "14:00", color: "#f59e0b", category: "personal" }],
  10: [{ title: "건강검진", time: "종일", color: "#10b981", category: "personal" }],
  15: [{ title: "교육 연수", time: "15:00", color: "#6366f1", category: "department" }],
  18: [
    { title: "팀장급 회의", time: "11:00", color: "#3b5bdb", category: "department" },
    { title: "클라이언트 미팅", time: "14:30", color: "#ef4444", category: "personal" },
    { title: "병원 예약", time: "16:00", color: "#9ca3af", category: "personal", isPrivate: true },
  ],
  20: [{ title: "프로젝트 발표", time: "10:00", color: "#ef4444", category: "department" }],
  22: [{ title: "신입사원 OJT", time: "09:00", color: "#f59e0b", category: "company" }],
  25: [{ title: "상반기 성과보고", time: "14:00", color: "#6366f1", category: "company" }],
  28: [{ title: "분기 경영 보고", time: "16:00", color: "#2c5aa0", category: "company" }],
};

const MY_CALENDARS = [
  { name: "내 일정", color: "#3b5bdb" },
  { name: "부서 일정", color: "#10b981" },
  { name: "전사 일정", color: "#f59e0b" },
];

// 미니 캘린더용 간단 컴포넌트
function MiniCalendar({
  year, month,
  onPrev, onNext,
  selectedDay,
  onSelectDay,
}: {
  year: number; month: number;
  onPrev: () => void; onNext: () => void;
  selectedDay: number;
  onSelectDay: (d: number) => void;
}) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const today = new Date();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-700">{year}년 {MONTH_NAMES[month]}</span>
        <div className="flex gap-1">
          <button onClick={onPrev} className="p-0.5 text-gray-400 hover:text-gray-700"><ChevronLeft size={14}/></button>
          <button onClick={onNext} className="p-0.5 text-gray-400 hover:text-gray-700"><ChevronRight size={14}/></button>
        </div>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d, i) => (
          <div key={d} className={`text-center text-[10px] font-medium py-0.5 ${i===0?"text-red-400":i===6?"text-blue-500":"text-gray-400"}`}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const isSelected = day === selectedDay;
          const col = idx % 7;
          return (
            <div
              key={idx}
              onClick={() => day && onSelectDay(day)}
              className={`flex items-center justify-center rounded-full w-6 h-6 mx-auto text-[11px] cursor-pointer
                ${isSelected ? "bg-[#3b5bdb] text-white font-bold" :
                  isToday ? "bg-blue-100 text-[#3b5bdb] font-bold" :
                  col===0 ? "text-red-400" : col===6 ? "text-blue-500" : "text-gray-600"}
                ${day ? "hover:bg-gray-100" : ""}
              `}
            >
              {day || ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarView({
  scheduleCurrentDate,
  onScheduleCurrentDateChange,
  selectedCalendarDay,
  onSelectedCalendarDayChange,
  googleCalendarConnected,
  onGoogleCalendarConnectedChange,
}: CalendarViewProps) {
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEventItem | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);

  const year = scheduleCurrentDate.getFullYear();
  const month = scheduleCurrentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const today = new Date();

  const allCells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (allCells.length % 7 !== 0) allCells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < allCells.length; i += 7) weeks.push(allCells.slice(i, i + 7));

  const prevMonth = () => onScheduleCurrentDateChange(new Date(year, month - 1, 1));
  const nextMonth = () => onScheduleCurrentDateChange(new Date(year, month + 1, 1));
  const goToday = () => {
    onScheduleCurrentDateChange(new Date());
    onSelectedCalendarDayChange(today.getDate());
  };

  const handleEventClick = (ev: ScheduleEventItem) => {
    setSelectedEvent(ev);
    setShowEventDetail(true);
  };

  return (
    <div className="flex h-full min-h-dvh bg-white">
      {/* 사이드바 */}
      {showSidebar && (
        <div className="w-56 flex-shrink-0 border-r border-gray-200 flex flex-col bg-white overflow-y-auto">
          {/* 로고 */}
          <div className="px-4 pt-4 pb-3 flex items-center gap-2 border-b border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-[#3b5bdb] flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="text-sm font-bold text-gray-800">캘린더</span>
          </div>

          {/* 미니 캘린더 */}
          <div className="px-3 py-4 border-b border-gray-100">
            <MiniCalendar
              year={year} month={month}
              onPrev={prevMonth} onNext={nextMonth}
              selectedDay={selectedCalendarDay}
              onSelectDay={onSelectedCalendarDayChange}
            />
          </div>

          {/* 검색 */}
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2.5 py-1.5">
              <Search size={13} className="text-gray-400"/>
              <input className="bg-transparent text-xs text-gray-600 outline-none w-full placeholder:text-gray-400" placeholder="일정 검색"/>
            </div>
          </div>

          {/* 내 캘린더 */}
          <div className="px-3 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">내 캘린더</span>
              <button className="text-gray-400 hover:text-gray-600"><Plus size={13}/></button>
            </div>
            {MY_CALENDARS.map((cal) => (
              <div key={cal.name} className="flex items-center gap-2 py-1">
                <div className="w-3 h-3 rounded-sm" style={{ background: cal.color }}/>
                <span className="text-xs text-gray-700">{cal.name}</span>
              </div>
            ))}
          </div>

          {/* Google Calendar 연동 */}
          <div className="px-3 py-3 mt-auto border-t border-gray-100">
            <button
              onClick={() => onGoogleCalendarConnectedChange(!googleCalendarConnected)}
              className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors
                ${googleCalendarConnected ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {googleCalendarConnected ? "Google 연동됨" : "Google 연동"}
            </button>
          </div>
        </div>
      )}

      {/* 메인 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 상단 바 */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <button
            onClick={() => setShowSidebar(v => !v)}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <button className="flex items-center gap-1.5 bg-[#3b5bdb] text-white rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-[#2f4fc7]">
            <Plus size={14}/> 만들기
          </button>

          <button onClick={goToday} className="border border-gray-300 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
            오늘
          </button>

          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500">
              <ChevronLeft size={18}/>
            </button>
            <button onClick={nextMonth} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500">
              <ChevronRight size={18}/>
            </button>
          </div>

          <h2 className="text-base font-semibold text-gray-800">
            {year}년 {MONTH_NAMES[month]}
          </h2>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {DAY_NAMES.map((d, i) => (
            <div
              key={d}
              className={`py-2 text-center text-xs font-medium border-r border-gray-100 last:border-r-0
                ${i===0?"text-red-400":i===6?"text-[#3b5bdb]":"text-gray-400"}`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* 캘린더 그리드 */}
        <div className="flex-1 grid grid-rows-[repeat(auto-fit,minmax(0,1fr))]" style={{ gridTemplateRows: `repeat(${weeks.length}, 1fr)` }}>
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0" style={{ minHeight: 90 }}>
              {week.map((day, dIdx) => {
                const isToday = day !== null &&
                  day === today.getDate() &&
                  month === today.getMonth() &&
                  year === today.getFullYear();
                const isSelected = day === selectedCalendarDay;
                const dayEvents = day ? (SCHEDULE_EVENTS[day] || []) : [];
                const col = dIdx;

                return (
                  <div
                    key={dIdx}
                    onClick={() => day && onSelectedCalendarDayChange(day)}
                    className={`border-r border-gray-100 last:border-r-0 px-1 pt-1 pb-1 cursor-pointer hover:bg-gray-50 transition-colors
                      ${!day ? "bg-gray-50/50" : ""}
                    `}
                  >
                    {/* 날짜 숫자 */}
                    <div className="mb-1">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium
                          ${isToday ? "bg-[#3b5bdb] text-white font-bold" :
                            isSelected ? "bg-blue-100 text-[#3b5bdb] font-bold" :
                            col===0 ? "text-red-400" :
                            col===6 ? "text-[#3b5bdb]" :
                            day ? "text-gray-700" : "text-gray-300"}
                        `}
                      >
                        {day || ""}
                      </span>
                    </div>

                    {/* 이벤트 목록 */}
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map((ev, ei) => (
                        <button
                          key={ei}
                          onClick={(e) => { e.stopPropagation(); handleEventClick(ev); }}
                          className="w-full flex items-center gap-1 rounded px-1 py-0.5 text-left hover:brightness-95 transition-all"
                          style={{ background: ev.color + "18" }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ev.color }}/>
                          <span className="text-[10px] font-medium truncate" style={{ color: ev.color }}>
                            {ev.isPrivate ? "비공개" : ev.title}
                          </span>
                        </button>
                      ))}
                      {dayEvents.length > 2 && (
                        <p className="text-[10px] text-gray-400 px-1">+{dayEvents.length - 2}개</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 이벤트 상세 바텀시트 */}
      {showEventDetail && selectedEvent && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowEventDetail(false)}/>
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm" style={{ background: selectedEvent.color }}/>
                <span className="text-sm font-semibold text-gray-900">
                  {selectedEvent.isPrivate ? "비공개 일정" : selectedEvent.title}
                </span>
              </div>
              <button onClick={() => setShowEventDetail(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <p>🕐 {selectedEvent.time}</p>
              {selectedEvent.category && (
                <p>📁 {selectedEvent.category === "personal" ? "개인" : selectedEvent.category === "department" ? "부서" : "전사"} 일정</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
