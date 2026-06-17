"use client";

import React from "react";
import { C, MONO, WardCard, WardBtn, WardIcons } from "@/shared/ui/WardUI";
import { SHIFT_ROWS, SHIFT_CODES, CAL_YEAR, CAL_MONTH, DAYS_IN_MONTH, TODAY } from "@/features/ward-dashboard/data";
import type { ShiftCode } from "@/features/ward-dashboard/types";

interface Props {
  toast: (msg: string) => void;
}

const WD = ["일", "월", "화", "수", "목", "금", "토"];

export function TabShift({ toast }: Props) {
  const todayDay = new Date(TODAY + "T00:00:00").getDate();
  const days = Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1);

  const dutyCount = days.map((d) =>
    SHIFT_ROWS.filter((r) => (["D", "E", "N"] as ShiftCode[]).includes(r.row[d - 1])).length
  );

  const meRow = SHIFT_ROWS[0];
  const myCount: Record<ShiftCode, number> = { D: 0, E: 0, N: 0, "휴": 0 };
  meRow.row.forEach((c) => myCount[c]++);

  const stickyL: React.CSSProperties = { position: "sticky", left: 0, zIndex: 2, background: C.surface };

  function ShiftCell({ code, isToday }: { code: ShiftCode; isToday: boolean }) {
    const s = SHIFT_CODES[code];
    return (
      <td style={{ padding: 3, textAlign: "center" }} onClick={() => toast(s.label)}>
        <div style={{
          width: 30, height: 30, margin: "0 auto", borderRadius: 7,
          background: s.bg, color: s.fg, fontSize: 12, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", opacity: code === "휴" ? 0.85 : 1,
          outline: isToday ? `2px solid ${C.primaryDeep}` : "none",
          outlineOffset: 1,
        }}>{code}</div>
      </td>
    );
  }

  return (
    <div>
      {/* 상단 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span onClick={() => toast("이전 달")} style={{ cursor: "pointer", color: C.textFaint, display: "flex" }}>{WardIcons.chevL(18, C.textFaint)}</span>
          <span style={{ fontSize: 17, fontWeight: 800, color: C.ink }}>{CAL_YEAR}년 {CAL_MONTH}월 근무표</span>
          <span onClick={() => toast("다음 달")} style={{ cursor: "pointer", color: C.textFaint, display: "flex" }}>{WardIcons.chevR(18, C.textFaint)}</span>
          <span style={{ fontSize: 12, color: C.textFaint, marginLeft: 4 }}>· 11병동 간호 인력 {SHIFT_ROWS.length}명</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <WardBtn variant="ghost" icon={WardIcons.download(16, C.textMuted)} onClick={() => toast("근무표를 엑셀로 내보냈습니다")}>엑셀</WardBtn>
          <WardBtn variant="primary" icon={WardIcons.check(16, "#fff")} onClick={() => toast("근무표가 저장되었습니다")}>근무표 저장</WardBtn>
        </div>
      </div>

      {/* 범례 */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        {(Object.entries(SHIFT_CODES) as [ShiftCode, typeof SHIFT_CODES[ShiftCode]][]).map(([c, s]) => (
          <div key={c} style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 8, background: C.surface, border: `1px solid ${C.border}` }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: s.bg, color: s.fg, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{c}</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.textDark, whiteSpace: "nowrap" }}>{s.label}</span>
            <span style={{ fontSize: 10.5, color: C.textFaint, fontFamily: MONO, whiteSpace: "nowrap" }}>{s.time}</span>
          </div>
        ))}
      </div>

      {/* 표 */}
      <WardCard style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 1080 }}>
            <thead>
              <tr style={{ background: C.bg }}>
                <th style={{ ...stickyL, background: C.bg, textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: C.textMuted, minWidth: 130, borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}` }}>직원</th>
                {days.map((d) => {
                  const wd = new Date(CAL_YEAR, CAL_MONTH - 1, d).getDay();
                  const isToday = d === todayDay;
                  return (
                    <th key={d} style={{ padding: "6px 0", minWidth: 36, borderBottom: `1px solid ${C.border}`, background: isToday ? C.primarySoft : C.bg }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: wd === 0 ? C.oebak : wd === 6 ? C.primaryDeep : C.textFaint }}>{WD[wd]}</div>
                      <div style={{ fontSize: 11.5, fontWeight: isToday ? 800 : 600, color: isToday ? C.primaryDeep : C.textDark }}>{d}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {SHIFT_ROWS.map((r) => {
                const isMe = r.id === "s01";
                return (
                  <tr key={r.id} style={{ background: isMe ? C.primarySoft + "33" : "transparent" }}>
                    <td style={{ ...stickyL, background: isMe ? "#eaf7fa" : C.surface, padding: "8px 14px", borderBottom: `1px solid ${C.divider}`, borderRight: `1px solid ${C.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        {isMe && <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.primaryDeep, flexShrink: 0 }} />}
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, whiteSpace: "nowrap" }}>{r.name}</div>
                          <div style={{ fontSize: 10, color: C.textFaint }}>{r.role}</div>
                        </div>
                      </div>
                    </td>
                    {r.row.map((c, di) => (
                      <ShiftCell key={di} code={c} isToday={di + 1 === todayDay} />
                    ))}
                  </tr>
                );
              })}
              {/* 합계 행 */}
              <tr style={{ background: C.bg }}>
                <td style={{ ...stickyL, background: C.bg, padding: "8px 14px", fontSize: 11, fontWeight: 700, color: C.textMuted, borderTop: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}` }}>일별 합계</td>
                {dutyCount.map((cnt, di) => (
                  <td key={di} style={{ textAlign: "center", padding: "8px 0", fontSize: 11, fontWeight: 700, borderTop: `1px solid ${C.border}`, color: cnt < 3 ? C.warn : C.textMuted }}>{cnt}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </WardCard>

      {/* 내 통계 */}
      <div style={{ marginTop: 16, display: "flex", gap: 14 }}>
        <WardCard style={{ flex: 1, padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 14 }}>{meRow.name}의 6월 근무 통계</div>
          <div style={{ display: "flex", gap: 10 }}>
            {(Object.entries(SHIFT_CODES) as [ShiftCode, typeof SHIFT_CODES[ShiftCode]][]).map(([c, s]) => (
              <div key={c} style={{ flex: 1, padding: "10px 12px", borderRadius: 9, background: s.bg, textAlign: "center" }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: s.fg, color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px" }}>{c}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.fg }}>{myCount[c]}</div>
                <div style={{ fontSize: 10, color: C.textFaint, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </WardCard>
        <WardCard style={{ padding: "18px 20px", maxWidth: 320 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 10 }}>안내</div>
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.7 }}>
            일별 합계가 <b style={{ color: C.warn }}>3명 미만</b>인 날은 인력 부족으로 표시됩니다.<br />
            근무 셀을 클릭해 코드를 변경하세요 (수간호사 권한 필요).
          </div>
        </WardCard>
      </div>
    </div>
  );
}
