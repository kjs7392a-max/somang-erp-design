"use client";

import React, { useState } from "react";
import { C, MONO, WardCard, WardBadge, WardBtn, WardSegmented, WardIcons, fmtK } from "@/shared/ui/WardUI";
import { EXAMS, CAL_YEAR, CAL_MONTH, DAYS_IN_MONTH, TODAY } from "@/features/ward-dashboard/data";
import type { Exam } from "@/features/ward-dashboard/types";

interface Props {
  toast: (msg: string) => void;
}

const WD = ["일", "월", "화", "수", "목", "금", "토"];

export function TabExam({ toast }: Props) {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [selDate, setSelDate] = useState(TODAY);

  const examsByDate = EXAMS.reduce<Record<string, Exam[]>>((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});

  const selExams = examsByDate[selDate] || [];

  // Calendar grid
  const firstDay = new Date(CAL_YEAR, CAL_MONTH - 1, 1).getDay();
  const totalCells = firstDay + DAYS_IN_MONTH;
  const weeks = Math.ceil(totalCells / 7);
  const todayDate = new Date(TODAY + "T00:00:00").getDate();

  function cellDate(cell: number): number | null {
    const d = cell - firstDay + 1;
    return d >= 1 && d <= DAYS_IN_MONTH ? d : null;
  }
  function dateStr(d: number) {
    return `${CAL_YEAR}-${String(CAL_MONTH).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  return (
    <div>
      {/* 상단 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <WardSegmented
            options={[
              { id: "calendar", label: "월간 캘린더", icon: WardIcons.calendar(14, view === "calendar" ? C.primaryDeep : C.textMuted) },
              { id: "list", label: "리스트", icon: WardIcons.clipboard(14, view === "list" ? C.primaryDeep : C.textMuted) },
            ]}
            value={view}
            onChange={(v) => setView(v as "calendar" | "list")}
          />
          <span style={{ fontSize: 12.5, color: C.textMuted }}>6월 총 <b style={{ color: C.ink }}>{EXAMS.length}건</b></span>
        </div>
        <WardBtn variant="primary" icon={WardIcons.plus(16, "#fff")} onClick={() => toast("검사 일정 추가 화면을 준비 중입니다")}>일정 추가</WardBtn>
      </div>

      {view === "calendar" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }}>
          {/* 캘린더 */}
          <WardCard style={{ padding: "20px 22px" }}>
            {/* 월 네비 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span onClick={() => toast("이전 달")} style={{ cursor: "pointer", color: C.textFaint, display: "flex" }}>{WardIcons.chevL(20, C.textFaint)}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>{CAL_YEAR}년 {CAL_MONTH}월</span>
                <span onClick={() => toast("다음 달")} style={{ cursor: "pointer", color: C.textFaint, display: "flex" }}>{WardIcons.chevR(20, C.textFaint)}</span>
              </div>
              <WardBtn size="sm" variant="ghost" onClick={() => setSelDate(TODAY)}>오늘</WardBtn>
            </div>
            {/* 요일 헤더 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
              {WD.map((w, i) => (
                <div key={w} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: i === 0 ? C.oebak : i === 6 ? C.primaryDeep : C.textFaint, padding: "4px 0" }}>{w}</div>
              ))}
            </div>
            {/* 날짜 셀 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {Array.from({ length: weeks * 7 }, (_, cell) => {
                const d = cellDate(cell);
                if (!d) return <div key={cell} />;
                const ds = dateStr(d);
                const exs = examsByDate[ds] || [];
                const isToday = d === todayDate;
                const isSel = ds === selDate;
                const wd = cell % 7;
                return (
                  <div key={cell} onClick={() => setSelDate(ds)}
                    style={{
                      minHeight: 74, borderRadius: 8, padding: "6px 7px", cursor: "pointer",
                      border: isSel ? `2px solid ${C.primaryDeep}` : `1px solid ${isSel ? C.primaryDeep : C.borderSoft}`,
                      background: isToday ? C.primarySoft + "80" : "transparent",
                      transition: "border-color 0.1s",
                    }}
                    onMouseEnter={(e) => { if (!isSel) (e.currentTarget as HTMLElement).style.borderColor = C.primary; }}
                    onMouseLeave={(e) => { if (!isSel) (e.currentTarget as HTMLElement).style.borderColor = C.borderSoft; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: isToday ? 800 : 600,
                        background: isToday ? C.primaryDeep : "transparent",
                        color: isToday ? "#fff" : wd === 0 ? C.oebak : wd === 6 ? C.primaryDeep : C.ink,
                      }}>{d}</span>
                      {exs.length > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: C.primaryDeep }}>{exs.length}건</span>}
                    </div>
                    {exs.slice(0, 2).map((e, i) => (
                      <div key={i} style={{ fontSize: 10, padding: "2px 5px", borderRadius: 4, background: e.done ? C.chipBg : C.primarySoft, color: e.done ? C.textFaint : C.primaryDeep, fontWeight: 600, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {e.time} {e.name}
                      </div>
                    ))}
                    {exs.length > 2 && <div style={{ fontSize: 9.5, color: C.textFaint, fontWeight: 600 }}>+{exs.length - 2}건</div>}
                  </div>
                );
              })}
            </div>
          </WardCard>

          {/* 날짜 패널 */}
          <WardCard style={{ padding: "20px 22px", position: "sticky", top: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, marginBottom: 4 }}>{fmtK(selDate, true)}</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>검사 {selExams.length}건</div>
            {selExams.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 0", color: C.textFaint, fontSize: 13 }}>이 날에 검사 일정이 없습니다.</div>
            )}
            {[...selExams].sort((a, b) => a.time.localeCompare(b.time)).map((e, i) => (
              <div key={i} style={{ padding: "11px 0", borderBottom: i < selExams.length - 1 ? `1px solid ${C.divider}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontFamily: MONO, color: C.primaryDeep, fontWeight: 700 }}>{e.time}</span>
                  {e.done && <WardBadge tone="neutral">완료</WardBadge>}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, marginBottom: 3 }}>{e.name} <span style={{ fontSize: 11, color: C.textFaint, fontFamily: MONO }}>({e.bed})</span></div>
                <div style={{ fontSize: 12.5, color: C.text }}>{e.type}</div>
                <div style={{ fontSize: 11.5, color: C.textFaint, marginTop: 3 }}>{e.room} · {e.staff}</div>
              </div>
            ))}
            <div style={{ marginTop: 16 }}>
              <WardBtn size="sm" variant="soft" onClick={() => toast("이 날짜에 검사를 추가합니다")}>+ 이 날짜에 검사 추가</WardBtn>
            </div>
          </WardCard>
        </div>
      )}

      {view === "list" && (
        <WardCard style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "96px 96px 1.2fr 1fr 120px 80px", padding: "11px 18px", fontSize: 11, fontWeight: 700, color: C.textMuted, background: C.bg, borderBottom: `1px solid ${C.border}`, letterSpacing: "0.02em" }}>
            <span>날짜</span><span>시간</span><span>환자</span><span>검사종류</span><span>검사실</span><span>담당</span>
          </div>
          {[...EXAMS].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map((e, i, arr) => {
            const showDate = i === 0 || arr[i - 1].date !== e.date;
            const isToday = e.date === TODAY;
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "96px 96px 1.2fr 1fr 120px 80px", padding: "11px 18px", alignItems: "center", fontSize: 12.5, borderBottom: i < arr.length - 1 ? `1px solid ${C.divider}` : "none", background: isToday ? C.primarySoft + "55" : "transparent" }}>
                <span style={{ fontSize: 12, fontFamily: MONO, color: showDate ? C.textDark : "transparent", fontWeight: 700 }}>{e.date.slice(5).replace("-", ".")}</span>
                <span style={{ fontFamily: MONO, fontSize: 12, color: C.primaryDeep, fontWeight: 700 }}>{e.time}</span>
                <div>
                  <span style={{ fontWeight: 700, color: C.ink }}>{e.name}</span>
                  <span style={{ fontSize: 11, color: C.textFaint, marginLeft: 6, fontFamily: MONO }}>{e.bed}</span>
                </div>
                <span style={{ color: C.text }}>{e.type}</span>
                <span style={{ color: C.textMuted, fontSize: 12 }}>{e.room}</span>
                <span style={{ color: C.textMuted, fontSize: 12 }}>{e.done ? <WardBadge tone="neutral">완료</WardBadge> : e.staff}</span>
              </div>
            );
          })}
        </WardCard>
      )}
    </div>
  );
}
