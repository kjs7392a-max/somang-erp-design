"use client";

import React from "react";
import { C, FONT, MONO, WardCard, SectionTitle, WardBadge, WardBtn, WardIcons, fmtK, fmtDT } from "@/shared/ui/WardUI";
import { PATIENTS, SHIFT_ROWS, SHIFT_CODES, TODAY } from "@/features/ward-dashboard/data";
import type { Leave } from "@/features/ward-dashboard/types";

interface Props {
  leaves: Leave[];
  onOpenPatient: (id: string) => void;
  goTab: (tab: string) => void;
}

function KpiCard({ icon, label, value, unit, hint, tone = "primary" }: {
  icon: keyof typeof WardIcons; label: string; value: number; unit: string; hint: string; tone?: string;
}) {
  const tones: Record<string, { fg: string; bg: string }> = {
    primary: { fg: C.primaryDeep, bg: C.primarySoft },
    oebak: { fg: C.oebak, bg: C.oebakBg },
    oechul: { fg: C.oechul, bg: C.oechulBg },
    duty: { fg: C.ok, bg: C.okBg },
  };
  const t = tones[tone] || tones.primary;
  return (
    <WardCard style={{ flex: 1, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 12.5, color: C.textMuted, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</div>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: t.bg, color: t.fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {WardIcons[icon](18, t.fg)}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 34, fontWeight: 800, color: C.ink, letterSpacing: "-0.03em", fontFamily: FONT }}>{value}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.textMuted }}>{unit}</span>
      </div>
      <div style={{ fontSize: 11.5, color: C.textFaint }}>{hint}</div>
    </WardCard>
  );
}

export function TabStatus({ leaves, onOpenPatient, goTab }: Props) {
  const todayIdx = new Date(TODAY + "T00:00:00").getDate() - 1;
  const outPatients = PATIENTS.filter((p) => p.status === "외박" || p.status === "외출");
  const oebakCount = PATIENTS.filter((p) => p.status === "외박").length;
  const oechulCount = PATIENTS.filter((p) => p.status === "외출").length;
  const onDuty = SHIFT_ROWS.filter((r) => ["D", "E", "N"].includes(r.row[todayIdx])).length;

  const duty: Record<string, { name: string; role: string }[]> = { D: [], E: [], N: [] };
  SHIFT_ROWS.forEach((r) => {
    const c = r.row[todayIdx];
    if (c === "D" || c === "E" || c === "N") duty[c].push({ name: r.name, role: r.role });
  });

  const dutyMeta = [
    { code: "D" as const, label: "데이", time: "07:00–15:00", fg: C.shiftD, bg: C.shiftDbg },
    { code: "E" as const, label: "이브닝", time: "15:00–23:00", fg: C.shiftE, bg: C.shiftEbg },
    { code: "N" as const, label: "나이트", time: "23:00–07:00", fg: C.shiftN, bg: C.shiftNbg },
  ];

  const leaveFor = (name: string) => leaves.find((l) => l.name === name && l.status !== "복귀완료");

  return (
    <div>
      {/* KPI 4 */}
      <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
        <KpiCard icon="bed" label="현재 입원 환자" value={PATIENTS.length} unit="명" hint={`정원 24병상 · 가동 ${PATIENTS.length}/24`} tone="primary" />
        <KpiCard icon="door" label="오늘 외박" value={oebakCount} unit="명" hint="복귀 예정 확인 필요" tone="oebak" />
        <KpiCard icon="clock" label="오늘 외출" value={oechulCount} unit="명" hint="당일 복귀 대상" tone="oechul" />
        <KpiCard icon="users" label="현재 근무 중 직원" value={onDuty} unit="명" hint="데이·이브닝·나이트 합산" tone="duty" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: 16, alignItems: "start" }}>
        {/* 좌: 오늘 외박·외출 환자 */}
        <WardCard style={{ padding: "20px 22px" }}>
          <SectionTitle action="외박·외출 관리" onAction={() => goTab("leave")} sub={`오늘 병동을 비운 환자 ${outPatients.length}명`}>
            오늘 외박·외출 환자
          </SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 70px 96px 96px", padding: "0 4px 9px", fontSize: 10.5, fontWeight: 700, color: C.textFaint, letterSpacing: "0.02em", borderBottom: `1px solid ${C.divider}` }}>
            <span>병상 / 환자</span><span></span><span>유형</span><span>시작일</span><span>복귀예정</span>
          </div>
          {outPatients.map((p, i) => {
            const lv = leaveFor(p.name);
            return (
              <div key={p.id} onClick={() => onOpenPatient(p.id)}
                style={{ display: "grid", gridTemplateColumns: "100px 1fr 70px 96px 96px", alignItems: "center", padding: "12px 4px", cursor: "pointer", borderBottom: i < outPatients.length - 1 ? `1px solid ${C.divider}` : "none" }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = C.bg}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                <span style={{ fontFamily: MONO, fontSize: 11.5, color: C.textMuted }}>{p.bed}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{p.name} <span style={{ fontSize: 11, fontWeight: 500, color: C.textFaint }}>{p.age}·{p.sex}</span></div>
                  <div style={{ fontSize: 11, color: C.textFaint, marginTop: 1 }}>{lv ? lv.reason : p.dx}</div>
                </div>
                <span><WardBadge tone={p.status === "외박" ? "oebak" : "oechul"} dot>{p.status}</WardBadge></span>
                <span style={{ fontSize: 11.5, color: C.textMuted, fontFamily: MONO }}>{lv ? fmtDT(lv.depart) : "—"}</span>
                <span style={{ fontSize: 11.5, color: lv && lv.type === "외박" ? C.oebak : C.textMuted, fontFamily: MONO, fontWeight: lv ? 600 : 400 }}>{lv ? fmtDT(lv.expect) : "—"}</span>
              </div>
            );
          })}
          {outPatients.length === 0 && (
            <div style={{ padding: "24px 4px", textAlign: "center", color: C.textFaint, fontSize: 13 }}>오늘 외박·외출 환자가 없습니다.</div>
          )}
          {/* 영양과 식수 보고 요약 */}
          <div style={{ marginTop: 16, padding: "13px 16px", borderRadius: 10, background: C.bg, display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {WardIcons.bowl(19, C.primaryDeep)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>오늘 식사 제외 인원 <span style={{ color: C.primaryDeep }}>{outPatients.length}명</span></div>
              <div style={{ fontSize: 11, color: C.textFaint, marginTop: 1 }}>외박 {oebakCount} · 외출 {oechulCount} — 영양과 자동 보고 대상</div>
            </div>
            <WardBtn size="sm" variant="ghost" onClick={() => goTab("leave")}>상세</WardBtn>
          </div>
        </WardCard>

        {/* 우: 근무 스케줄 요약 */}
        <WardCard style={{ padding: "20px 22px" }}>
          <SectionTitle action="근무표" onAction={() => goTab("shift")} sub={fmtK(TODAY, true)}>오늘 근무 스케줄</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {dutyMeta.map((m) => {
              const people = duty[m.code];
              return (
                <div key={m.code} style={{ display: "flex", gap: 13, padding: "12px 14px", borderRadius: 10, background: m.bg }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: m.fg, color: "#fff", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{m.code}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: m.fg }}>{m.label}</span>
                      <span style={{ fontSize: 10.5, color: C.textFaint, fontFamily: MONO }}>{m.time}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: C.textDark, marginTop: 4, fontWeight: 500, lineHeight: 1.5 }}>
                      {people.length ? people.map((p) => p.name).join(" · ") : <span style={{ color: C.textFaint }}>배정 없음</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: C.textFaint, fontWeight: 600 }}>{people.length}명</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.divider}`, fontSize: 11.5, color: C.textFaint, lineHeight: 1.6 }}>
            수간호사 <b style={{ color: C.textDark }}>{SHIFT_ROWS[0].name}</b> · 오늘 야간 당직 책임 간호사는 나이트 담당자입니다.
          </div>
        </WardCard>
      </div>
    </div>
  );
}
